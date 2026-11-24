import { createHash } from "node:crypto"
import { createReadStream, createWriteStream, type ReadStream } from "node:fs"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Transform } from "node:stream"
import { pipeline } from "node:stream/promises"
import type { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { IJobsPartnersFluxSignal } from "shared/models/jobs-partners-flux-signal.model"
import type { CollectionName } from "shared/models/models"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"

const MAX_CHECKS_KEPT = 100

export type FluxImportOptions = {
  /** Faux par défaut : le run de nuit reconstruit toujours, seul le cycle de journée (#5670) l'active. */
  skipIfUnchanged?: boolean
}

export type FluxSkipped = { skipped: true; reason: string }

/** Un run sauté n'a touché ni raw ni computed : il ne doit pas déclencher `cancelRemovedJobsPartners`. */
export const isFluxSkipped = (result: unknown): result is FluxSkipped => typeof result === "object" && result !== null && (result as { skipped?: unknown }).skipped === true

export type FluxValidators = { etag: string | null; last_modified: Date | null; content_length: number | null }

export type FluxSource = {
  /** Validateurs lus sans télécharger le contenu (HEAD, stat SFTP, listing) */
  probe?: () => Promise<FluxValidators>
  download: () => Promise<{ stream: NodeJS.ReadableStream; validators: FluxValidators }>
}

export type FluxDefinition = {
  partnerLabel: JOBPARTNERS_LABEL
  rawCollection: CollectionName
  source: FluxSource
}

type Measure = { validators: FluxValidators; sha256: string; size: number }
type Download = Measure & { path: string }

const getSignal = (partnerLabel: JOBPARTNERS_LABEL) => getDbCollection("jobs_partners_flux_signals").findOne({ partner_label: partnerLabel })

/**
 * Conclure sans télécharger exige la taille annoncée et un etag ou une date, tous identiques : un etag
 * seul ne suffit pas, un serveur peut le renvoyer constant (cf. validators_unreliable_at).
 */
const sameValidators = (previous: IJobsPartnersFluxSignal, next: FluxValidators): boolean =>
  next.content_length !== null &&
  (next.etag !== null || next.last_modified !== null) &&
  (previous.content_length ?? null) === next.content_length &&
  (previous.etag ?? null) === next.etag &&
  (previous.last_modified?.getTime() ?? null) === (next.last_modified?.getTime() ?? null)

// La collection raw peut avoir été vidée hors import (restauration de recette, opération manuelle) :
// sauter laisserait alors le partenaire sans offres jusqu'au run de nuit.
const isRawIntact = async (flux: FluxDefinition, previous: IJobsPartnersFluxSignal | null): Promise<boolean> => {
  if (!previous?.sha256 || previous.offer_count == null) return false
  return (await getDbCollection(flux.rawCollection).countDocuments({})) === previous.offer_count
}

const hasUnchangedValidators = async (flux: FluxDefinition, previous: IJobsPartnersFluxSignal): Promise<boolean> => {
  if (!flux.source.probe || previous.validators_unreliable_at) return false
  try {
    return sameValidators(previous, await flux.source.probe())
  } catch (err) {
    logger.warn({ err, partnerLabel: flux.partnerLabel }, "flux : validateurs illisibles, téléchargement complet")
    return false
  }
}

/**
 * Flux de la source, mesuré (sha256, taille) au passage. Le téléchargement ne démarre qu'à la première
 * lecture : `process` lit les flux groupés l'un après l'autre, et une réponse ouverte trop tôt resterait
 * inactive pendant le traitement du précédent.
 */
const openMeasuredStream = (flux: FluxDefinition) => {
  const hash = createHash("sha256")
  let size = 0
  let validators: FluxValidators | null = null
  let measure: Measure | null = null
  let started = false
  const stream = new Transform({
    transform(chunk, _encoding, callback) {
      hash.update(chunk)
      size += Buffer.byteLength(chunk)
      callback(null, chunk)
    },
    flush(callback) {
      measure = { validators: validators!, sha256: hash.digest("hex"), size }
      logger.info({ partnerLabel: flux.partnerLabel, size, validators }, "flux téléchargé")
      callback()
    },
    read(bytes) {
      if (!started) {
        started = true
        flux.source.download().then(
          (download) => {
            validators = download.validators
            pipeline(download.stream, stream).catch((err) => stream.destroy(err))
          },
          (err) => stream.destroy(err)
        )
      }
      Transform.prototype._read.call(stream, bytes)
    },
  })
  return { stream, getMeasure: () => measure }
}

const downloadToFile = async (flux: FluxDefinition, path: string): Promise<Download> => {
  const { stream, getMeasure } = openMeasuredStream(flux)
  await pipeline(stream, createWriteStream(path))
  return { path, ...getMeasure()! }
}

const pushCheck = (check: { checked_at: Date; changed: boolean; skipped: boolean }) => ({
  checks: { $each: [check], $slice: -MAX_CHECKS_KEPT },
})

const recordSkip = async (fluxes: FluxDefinition[], checkedAt: Date, downloads: Download[] | null) => {
  for (const [index, flux] of fluxes.entries()) {
    const download = downloads?.[index]
    await getDbCollection("jobs_partners_flux_signals").updateOne(
      { partner_label: flux.partnerLabel },
      {
        // contenu identique au dernier import : les validateurs du jour le décrivent aussi
        ...(download ? { $set: { ...download.validators } } : {}),
        $push: pushCheck({ checked_at: checkedAt, changed: false, skipped: true }),
      }
    )
  }
}

const recordImport = async (flux: FluxDefinition, previous: IJobsPartnersFluxSignal | null, download: Measure, checkedAt: Date) => {
  const changed = previous?.sha256 !== download.sha256
  const unreliable = Boolean(previous?.sha256) && changed && sameValidators(previous!, download.validators)
  if (unreliable) {
    logger.warn(
      { partnerLabel: flux.partnerLabel, validators: download.validators },
      "flux : contenu changé sous des validateurs identiques, ils ne seront plus crus sans téléchargement"
    )
  }
  const offerCount = await getDbCollection(flux.rawCollection).countDocuments({})
  await getDbCollection("jobs_partners_flux_signals").updateOne(
    { partner_label: flux.partnerLabel },
    {
      $set: {
        ...download.validators,
        size: download.size,
        sha256: download.sha256,
        imported_at: checkedAt,
        offer_count: offerCount,
        ...(changed ? { changed_at: checkedAt } : {}),
        ...(unreliable ? { validators_unreliable_at: checkedAt } : {}),
      },
      $push: pushCheck({ checked_at: checkedAt, changed, skipped: false }),
    },
    { upsert: true }
  )
}

const processAndRecord = async <T>(
  fluxes: FluxDefinition[],
  previous: (IJobsPartnersFluxSignal | null)[],
  checkedAt: Date,
  process: (streams: NodeJS.ReadableStream[]) => Promise<T>
): Promise<T> => {
  const opened = fluxes.map(openMeasuredStream)
  try {
    const result = await process(opened.map(({ stream }) => stream))
    for (const [index, flux] of fluxes.entries()) {
      const measure = opened[index].getMeasure()
      if (!measure) {
        logger.warn({ partnerLabel: flux.partnerLabel }, "flux : non lu jusqu'au bout par le traitement, signal non enregistré")
        continue
      }
      await recordImport(flux, previous[index], measure, checkedAt)
    }
    return result
  } finally {
    for (const { stream } of opened) stream.destroy()
  }
}

/**
 * Importe un ou plusieurs flux traités ensemble (ex. les deux flux Hellowork, dédupliqués l'un contre
 * l'autre) : avec `skipIfUnchanged`, le run est sauté si aucun n'a changé, sinon tous sont retraités.
 * Le contenu téléchargé (sha256) fait foi ; les validateurs de la source n'évitent que le téléchargement.
 * Seule la décision sur le sha256 passe par un fichier temporaire ; sinon le flux est traité au fil du
 * téléchargement. Le signal n'est enregistré qu'après le succès de `process`, pour qu'un échec soit
 * retenté au run suivant.
 */
export const importFluxIfChanged = async <T>({
  fluxes,
  skipIfUnchanged,
  process,
}: {
  fluxes: FluxDefinition[]
  skipIfUnchanged: boolean
  process: (streams: NodeJS.ReadableStream[]) => Promise<T>
}): Promise<T | FluxSkipped> => {
  const checkedAt = new Date()
  const partnerLabels = fluxes.map(({ partnerLabel }) => partnerLabel)
  const previous = await Promise.all(partnerLabels.map(getSignal))

  if (!skipIfUnchanged) {
    return processAndRecord(fluxes, previous, checkedAt, process)
  }

  if (!(await Promise.all(fluxes.map((flux, index) => isRawIntact(flux, previous[index])))).every(Boolean)) {
    logger.info({ partnerLabels }, "flux : aucun import complet connu ou raw modifié, retraitement")
    return processAndRecord(fluxes, previous, checkedAt, process)
  }

  if ((await Promise.all(fluxes.map((flux, index) => hasUnchangedValidators(flux, previous[index]!)))).every(Boolean)) {
    await recordSkip(fluxes, checkedAt, null)
    logger.info({ partnerLabels }, "flux inchangé (validateurs), run sauté")
    return { skipped: true, reason: "validateurs inchangés" }
  }

  const directory = await mkdtemp(join(tmpdir(), "flux-"))
  const streams: ReadStream[] = []
  try {
    const downloads: Download[] = []
    for (const [index, flux] of fluxes.entries()) {
      downloads.push(await downloadToFile(flux, join(directory, String(index))))
    }

    if (downloads.every((download, index) => download.sha256 === previous[index]?.sha256)) {
      await recordSkip(fluxes, checkedAt, downloads)
      logger.info({ partnerLabels }, "flux inchangé (sha256), run sauté")
      return { skipped: true, reason: "contenu identique" }
    }

    streams.push(...downloads.map(({ path }) => createReadStream(path)))
    const result = await process(streams)

    for (const [index, flux] of fluxes.entries()) {
      await recordImport(flux, previous[index], downloads[index], checkedAt)
    }
    return result
  } finally {
    for (const stream of streams) stream.destroy()
    await rm(directory, { recursive: true, force: true })
  }
}
