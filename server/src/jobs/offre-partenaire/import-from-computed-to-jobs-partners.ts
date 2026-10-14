import { pipeline } from "node:stream/promises"
import { internal } from "@hapi/boom"
import type { AnyBulkWriteOperation, Filter, ObjectId } from "mongodb"
import { MongoBulkWriteError } from "mongodb"
import { TRAINING_CONTRACT_TYPE } from "shared/constants/index"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"
import { COMPUTED_ERROR_SOURCE } from "shared/models/jobs-partners-computed.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import { groupStreamData, limitStream } from "@/common/utils/stream-utils"

/** Seule origine d'annulation qu'une réapparition dans le flux invalide légitimement. */
const REACTIVATION_ALLOWED_GRANTED_BY = "cancel-removed-jobs-partners"

// Une lecture et une écriture par lot plutôt que deux requêtes par offre : le flux recruteurs LBA
// compte ~285 000 offres (#5607).
const IMPORT_BATCH_SIZE = 1_000
const IMPORT_BATCH_CONCURRENCY = 4

// `validated: true` garantit la conformité au modèle jobs_partners, cf. validateComputedJobPartners.
type ValidatedComputedJobPartner = Omit<IJobsPartnersOfferPrivate, "created_at">

type ExistingJobPartner = Pick<IJobsPartnersOfferPrivate, "_id" | "partner_label" | "partner_job_id" | "offer_status" | "offer_status_history">

const jobPartnerKey = ({ partner_label, partner_job_id }: { partner_label: string; partner_job_id: string }) => `${partner_label}\u0000${partner_job_id}`

const toJobPartner = (computedJobPartner: ValidatedComputedJobPartner): Partial<IJobsPartnersOfferPrivate> => ({
  partner_label: computedJobPartner.partner_label,
  partner_job_id: computedJobPartner.partner_job_id,
  contract_start: computedJobPartner.contract_start ?? null,
  contract_duration: computedJobPartner.contract_duration ?? null,
  contract_type: computedJobPartner.contract_type ?? [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION],
  contract_remote: computedJobPartner.contract_remote ?? null,
  contract_is_disabled_elligible: computedJobPartner.contract_is_disabled_elligible ?? false,
  offer_title: computedJobPartner.offer_title,
  offer_rome_codes: computedJobPartner.offer_rome_codes,
  offer_description: computedJobPartner.offer_description,
  offer_target_diploma: computedJobPartner.offer_target_diploma ?? null,
  offer_desired_skills: computedJobPartner.offer_desired_skills ?? [],
  offer_to_be_acquired_skills: computedJobPartner.offer_to_be_acquired_skills ?? [],
  offer_access_conditions: computedJobPartner.offer_access_conditions ?? [],
  offer_creation: computedJobPartner.offer_creation ?? null,
  offer_expiration: computedJobPartner.offer_expiration ?? null,
  offer_opening_count: computedJobPartner.offer_opening_count ?? 1,
  offer_status: computedJobPartner.offer_status ?? JOB_STATUS_ENGLISH.ACTIVE,
  workplace_siret: computedJobPartner.workplace_siret ?? null,
  workplace_brand: computedJobPartner.workplace_brand ?? null,
  workplace_legal_name: computedJobPartner.workplace_legal_name ?? null,
  workplace_website: computedJobPartner.workplace_website ?? null,
  workplace_name: computedJobPartner.workplace_name ?? null,
  workplace_description: computedJobPartner.workplace_description ?? null,
  workplace_size: computedJobPartner.workplace_size ?? null,
  workplace_address_label: computedJobPartner.workplace_address_label,
  workplace_address_street_label: computedJobPartner.workplace_address_street_label,
  workplace_address_zipcode: computedJobPartner.workplace_address_zipcode,
  workplace_address_city: computedJobPartner.workplace_address_city,
  workplace_geopoint: computedJobPartner.workplace_geopoint,
  workplace_idcc: computedJobPartner.workplace_idcc ?? null,
  workplace_opco: computedJobPartner.workplace_opco ?? null,
  workplace_naf_code: computedJobPartner.workplace_naf_code ?? null,
  workplace_naf_label: computedJobPartner.workplace_naf_label ?? null,
  apply_url: computedJobPartner.apply_url,
  apply_phone: computedJobPartner.apply_phone ?? null,
  apply_email: computedJobPartner.apply_email ?? null,
  offer_multicast: computedJobPartner.offer_multicast ?? true,
  offer_origin: computedJobPartner.offer_origin ?? null,
  rank: computedJobPartner.rank ?? null,
  duplicates: computedJobPartner.duplicates ?? null,
  cfa_siret: null,
  cfa_apply_email: null,
  cfa_address_label: null,
  cfa_legal_name: null,
  cfa_apply_phone: null,
})

const findExistingJobPartners = async (batch: ValidatedComputedJobPartner[]): Promise<Map<string, ExistingJobPartner>> => {
  const jobIdsByLabel = new Map<string, string[]>()
  for (const { partner_label, partner_job_id } of batch) {
    const jobIds = jobIdsByLabel.get(partner_label)
    if (jobIds) jobIds.push(partner_job_id)
    else jobIdsByLabel.set(partner_label, [partner_job_id])
  }
  const existingJobs = await getDbCollection("jobs_partners")
    .find(
      { $or: [...jobIdsByLabel].map(([partner_label, partner_job_ids]) => ({ partner_label, partner_job_id: { $in: partner_job_ids } })) },
      { projection: { partner_label: 1, partner_job_id: 1, offer_status: 1, offer_status_history: { $slice: -1 } } }
    )
    .toArray()
  return new Map(existingJobs.map((job) => [jobPartnerKey(job), job as ExistingJobPartner]))
}

const toUpsertOperation = (
  computedJobPartner: ValidatedComputedJobPartner,
  existingJob: ExistingJobPartner | undefined,
  importDate: Date,
  writeDate: Date
): AnyBulkWriteOperation<IJobsPartnersOfferPrivate> => {
  const partnerJobToUpsert = toJobPartner(computedJobPartner)

  // Une offre annulée n'est réactivée par le flux que si c'est le flux qui l'avait annulée.
  // Les fermetures décidées ailleurs (seuil de candidatures, doublons, classification, admin)
  // ne doivent pas être écrasées (observé en prod : PASS rouvrait chaque nuit ses offres
  // fermées au seuil de 80 candidatures). Sans preuve de l'auteur de l'annulation (historique
  // vide, ou dernière transition ACTIVE), on réactive.
  const lastTransition = existingJob?.offer_status_history?.at(-1)
  const lastCancellation = lastTransition?.status === JOB_STATUS_ENGLISH.ANNULEE ? lastTransition : undefined
  const isReactivation = existingJob?.offer_status === JOB_STATUS_ENGLISH.ANNULEE && partnerJobToUpsert.offer_status === JOB_STATUS_ENGLISH.ACTIVE
  if (isReactivation && lastCancellation && lastCancellation.granted_by !== REACTIVATION_ALLOWED_GRANTED_BY) {
    partnerJobToUpsert.offer_status = JOB_STATUS_ENGLISH.ANNULEE
  }

  const historyEntriesToPush = [
    ...(computedJobPartner.offer_status_history ?? []),
    ...(existingJob?.offer_status === JOB_STATUS_ENGLISH.ANNULEE && partnerJobToUpsert.offer_status === JOB_STATUS_ENGLISH.ACTIVE
      ? [{ date: importDate, status: JOB_STATUS_ENGLISH.ACTIVE, reason: "réactivée par le flux source", granted_by: "import-from-computed-to-jobs-partners" }]
      : []),
  ]

  return {
    updateOne: {
      filter: { partner_job_id: computedJobPartner.partner_job_id, partner_label: computedJobPartner.partner_label },
      update: {
        // updated_at horodaté à l'écriture du lot, pas au début de l'import : le cron delta de l'index
        // de recherche lit `updated_at >= now − 10 min` toutes les 5 min et l'import dure
        // ~26 min, un document daté du début serait déjà hors fenêtre (965 offres à position
        // périmée en prod le 2026-09-11). `importDate` date l'import (created_at, historique).
        $set: { ...partnerJobToUpsert, updated_at: writeDate },
        $setOnInsert: {
          created_at: importDate,
          _id: computedJobPartner._id,
          stats_detail_view: 0,
          stats_postuler: 0,
          stats_search_view: 0,
          ft_support: false,
          // $push crée le tableau à l'insertion ; un $setOnInsert sur le même chemin serait refusé par MongoDB.
          ...(historyEntriesToPush.length ? {} : { offer_status_history: [] }),
        },
        ...(historyEntriesToPush.length ? { $push: { offer_status_history: { $each: historyEntriesToPush } } } : {}),
      },
      upsert: true,
    },
  }
}

const failedIndexes = (err: unknown, batchSize: number): Map<number, unknown> => {
  if (err instanceof MongoBulkWriteError) {
    const writeErrors = [err.writeErrors].flat()
    // Une Error plutôt que errmsg : logger.error(chaîne, message) ne garderait que la chaîne.
    if (writeErrors.length > 0)
      return new Map(writeErrors.map((writeError) => [writeError.index, Object.assign(new Error(writeError.errmsg ?? "écriture refusée"), { code: writeError.code })]))
  }
  return new Map(Array.from({ length: batchSize }, (_, index) => [index, err]))
}

const markAsImportFailed = async (computedJobPartner: ValidatedComputedJobPartner, err: unknown) => {
  const newError = internal(
    `error converting computed_job_partner to job_partner, partner_label=${computedJobPartner.partner_label} partner_job_id=${computedJobPartner.partner_job_id}`
  )
  logger.error(err, newError.message)
  newError.cause = err
  sentryCaptureException(newError)

  try {
    // Deux mises à jour : MongoDB refuse $pull et $push sur le même chemin dans une seule (code 40).
    await getDbCollection("computed_jobs_partners").updateOne({ _id: computedJobPartner._id }, { $pull: { errors: { source: COMPUTED_ERROR_SOURCE.DB_ERROR } } })
    await getDbCollection("computed_jobs_partners").updateOne(
      { _id: computedJobPartner._id },
      {
        $set: { validated: false, updated_at: new Date() },
        $push: { errors: { source: COMPUTED_ERROR_SOURCE.DB_ERROR, error: err instanceof Error ? err.message : String(err) } },
      }
    )
  } catch (updateErr: unknown) {
    const updateError = internal(
      `error marking computed_job_partner as invalid after import failure, partner_label=${computedJobPartner.partner_label} partner_job_id=${computedJobPartner.partner_job_id}`
    )
    updateError.cause = updateErr
    sentryCaptureException(updateError)
  }
}

/**
 * `onImported` reçoit en fin d'import les _id jobs_partners écrits, pour les appelants qui
 * enchaînent sur ces offres (indexation du cron offres API). La liste n'est
 * construite que si `onImported` est fourni : le flux nightly importe des centaines de milliers
 * de documents.
 *
 * L'_id jobs_partners n'est pas toujours celui du document computed : l'upsert cible
 * `{partner_job_id, partner_label}`, une offre existante garde son _id.
 */
export const importFromComputedToJobsPartners = async (addedMatchFilter?: Filter<IComputedJobsPartners>, onImported?: (jobPartnerIds: ObjectId[]) => void | Promise<void>) => {
  logger.info(`import dans jobs_partners commencé`)
  const filters: Filter<IComputedJobsPartners>[] = [{ validated: true, business_error: null }]
  if (addedMatchFilter) {
    filters.push(addedMatchFilter)
  }

  const stream = getDbCollection("computed_jobs_partners").find({ $and: filters }).stream()

  const counters = { total: 0, success: 0, error: 0 }
  const importedIds: ObjectId[] | null = onImported ? [] : null
  const importDate = new Date()

  const importBatch = async (batch: ValidatedComputedJobPartner[]) => {
    // groupStreamData émet un lot vide quand le curseur ne renvoie rien.
    if (batch.length === 0) return
    const previousTotal = counters.total
    counters.total += batch.length
    if (Math.floor(counters.total / 10_000) > Math.floor(previousTotal / 10_000)) {
      logger.info(`import progression: ${counters.total} documents traités`)
    }

    let failures = new Map<number, unknown>()
    let existingJobs = new Map<string, ExistingJobPartner>()
    try {
      existingJobs = await findExistingJobPartners(batch)
      const writeDate = new Date()
      await getDbCollection("jobs_partners").bulkWrite(
        batch.map((computedJobPartner) => toUpsertOperation(computedJobPartner, existingJobs.get(jobPartnerKey(computedJobPartner)), importDate, writeDate)),
        { ordered: false }
      )
    } catch (err: unknown) {
      failures = failedIndexes(err, batch.length)
    }

    for (const [index, computedJobPartner] of batch.entries()) {
      if (failures.has(index)) {
        counters.error++
        await markAsImportFailed(computedJobPartner, failures.get(index))
      } else {
        counters.success++
        // _id de l'offre existante s'il y en a une, sinon celui posé par $setOnInsert.
        importedIds?.push(existingJobs.get(jobPartnerKey(computedJobPartner))?._id ?? computedJobPartner._id)
      }
    }
  }

  await pipeline(
    stream,
    groupStreamData<ValidatedComputedJobPartner>({ size: IMPORT_BATCH_SIZE }),
    limitStream<ValidatedComputedJobPartner[]>({ concurrency: IMPORT_BATCH_CONCURRENCY, processItem: importBatch })
  )

  logger.info({ counters }, "import dans jobs_partners terminé")

  if (importedIds?.length) {
    await onImported?.(importedIds)
  }

  return counters
}
