import { Readable } from "node:stream"
import { pipeline } from "node:stream/promises"
import { createGunzip } from "node:zlib"
import { internal } from "@hapi/boom"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import rawJobteaserModel from "shared/models/raw-jobteaser.model"
import { logger } from "@/common/logger"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import config from "@/config"
import type { FluxDefinition, FluxValidators } from "@/jobs/offre-partenaire/import-flux-if-changed"
import { importFromStreamInXml } from "@/jobs/offre-partenaire/import-from-stream-in-xml"
import { rawToComputedJobsPartners } from "@/jobs/offre-partenaire/raw-to-computed-jobs-partners"
import { jobteaserJobToJobsPartners, ZJobteaserJob } from "./jobteaser-mapper"

const rawCollectionName = rawJobteaserModel.collectionName
const offerXmlTag = "job"
const JOBTEASER_API_URL = "https://partneraccess.jobteaser.com/api/v2/user"

export type JobteaserFile = { last_modified: string; mode: number; name: string; size: number }

export const importJobteaserRaw = async (sourceStream: NodeJS.ReadableStream) => {
  return importFromStreamInXml({
    destinationCollection: rawCollectionName,
    offerXmlTag,
    stream: sourceStream,
    importName: JOBPARTNERS_LABEL.JOBTEASER,
    conflictingOpeningTagWithoutAttributes: true,
  })
}

// Le listing n'est pas garanti trié : le fichier du jour est celui au last_modified le plus récent.
export const selectLatestJobteaserFile = (list: JobteaserFile[]): JobteaserFile | undefined => {
  const dated = list.map((file) => ({ file, time: Date.parse(file.last_modified) }))
  const undated = dated.filter(({ time }) => Number.isNaN(time))
  if (undated.length > 0) {
    const error = internal("Jobteaser : last_modified illisible dans le listing, repli sur le dernier fichier listé", {
      values: undated.map(({ file }) => file.last_modified),
    })
    logger.error(error)
    sentryCaptureException(error)
    return list.at(-1)
  }
  return dated.reduce<{ file: JobteaserFile; time: number } | undefined>((latest, entry) => (!latest || entry.time > latest.time ? entry : latest), undefined)?.file
}

const fetchJobteaser = (path: string, authorization: string) =>
  fetch(`${JOBTEASER_API_URL}/${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json", Authorization: authorization },
  })

const findLatestJobteaserFile = async () => {
  const tokenResponse = await fetchJobteaser("token", `Basic ${btoa(`${config.jobteaserUserName}:${config.jobteaserPassword}`)}`)
  const token = ((await tokenResponse.json()) as { access_token: string; expires_at: string }).access_token

  const list = (await (await fetchJobteaser("dirs", `Bearer ${token}`)).json()) as JobteaserFile[]
  const file = selectLatestJobteaserFile(list)
  if (!file) {
    throw internal("Jobteaser : aucun fichier dans le listing")
  }
  return { token, file }
}

// Le nom du fichier sert d'identifiant de version, à la place d'un ETag.
const toValidators = (file: JobteaserFile): FluxValidators => {
  const time = Date.parse(file.last_modified)
  return { etag: file.name, last_modified: Number.isNaN(time) ? null : new Date(time), content_length: file.size }
}

export const getJobteaserFlux = (): FluxDefinition => {
  let latest: ReturnType<typeof findLatestJobteaserFile> | null = null
  // une erreur passagère de la sonde ne doit pas condamner le téléchargement du même run
  const findLatestOnce = () => {
    latest ??= findLatestJobteaserFile().catch((err) => {
      latest = null
      throw err
    })
    return latest
  }
  return {
    partnerLabel: JOBPARTNERS_LABEL.JOBTEASER,
    rawCollection: rawCollectionName,
    source: {
      probe: async () => toValidators((await findLatestOnce()).file),
      download: async () => {
        const { token, file } = await findLatestOnce()
        const fileResponse = await fetchJobteaser(`files?path=${file.name}`, `Bearer ${token}`)
        const gunzip = createGunzip()
        // pipeline, contrairement à .pipe(), détruit gunzip avec l'erreur du téléchargement : le consommateur la reçoit
        pipeline(Readable.fromWeb(fileResponse.body!), gunzip).catch(() => {
          // déjà propagée à gunzip
        })
        return { stream: gunzip, validators: toValidators(file) }
      },
    },
  }
}

export const importJobteaserToComputed = async () => {
  return rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.JOBTEASER,
    zodInput: ZJobteaserJob,
    mapper: jobteaserJobToJobsPartners,
    documentJobRoot: offerXmlTag,
  })
}
