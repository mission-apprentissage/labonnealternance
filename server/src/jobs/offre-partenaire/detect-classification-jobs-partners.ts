import type { AnyBulkWriteOperation, Filter } from "mongodb"
import GEIQ_WHITELIST from "shared/constants/geiq"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"
import { COMPUTED_ERROR_SOURCE, JOB_PARTNER_BUSINESS_ERROR, PARTNER_WHITELIST } from "shared/models/jobs-partners-computed.model"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { getCachedClassificationsByPairs, getClassification } from "@/services/cache-classification.service"
import { submitClassificationRequests } from "@/services/classification/classification-mistral-batch.service"
import type { FillComputedJobsPartnersContext } from "./fill-computed-jobs-partners"
import { buildComputedPartnersCandidateFilter, fillFieldsForComputedPartnersFactory } from "./fill-fields-for-partners-factory"

const CLASSIFICATION_SOURCE_FIELDS = [
  "workplace_description",
  "workplace_name",
  "offer_description",
  "offer_title",
  "partner_job_id",
  "partner_label",
] as const satisfies (keyof IComputedJobsPartners)[]
const CLASSIFICATION_FILLED_FIELDS = ["business_error"] as const satisfies (keyof IComputedJobsPartners)[]

// Au-delà de ce volume détecté dans un même run (import massif d'un partenaire, rattrapage après
// incident), le flux organique (quelques dizaines/centaines d'offres par run de 10 min) serait
// pénalisé si tout passait en synchrone dans le même cron : on bascule l'intégralité du lot
// détecté vers le batch Mistral, en bloquant explicitement la publication (business_error
// CLASSIFICATION_PENDING) en attendant le résultat — cf. classification-mistral-batch.service.ts.
//
// Ce seuil ne s'applique qu'aux offres ABSENTES de cache_classification : les offres déjà
// classées une nuit précédente sont servies par le cache avant tout comptage (voir
// applyCachedClassifications). Sans cette étape, computed_jobs_partners étant reconstruit chaque
// nuit, la totalité du catalogue non whitelisté (~20 000 offres mesurées en prod le 01/09/2026)
// repartait en batch chaque nuit, était annulée par cancelRemovedJobsPartners à 00h35 (pipeline
// « business_error non nul ») et n'était republiée qu'au retour du batch — 1 à 6 h de coupure
// quotidienne, et une coupure complète dès que Mistral ne répondait pas.
const SYNC_BATCH_THRESHOLD = 500

// Taille des groupes de lecture du cache : un `$in` de 1 000 partner_job_id par partenaire est
// servi par l'index {partner_job_id, partner_label} sans faire exploser la taille de la requête.
const CACHE_LOOKUP_GROUP_SIZE = 1_000

type CandidateKey = Pick<IComputedJobsPartners, "_id" | "partner_label" | "partner_job_id">

/**
 * Applique aux candidats les classifications déjà connues dans cache_classification, sans appel
 * Mistral : pousse CLASSIFICATION dans jobs_in_success (le document n'est plus candidat) et pose
 * business_error CFA si la classification retenue est « unpublish ». Retourne le nombre de
 * documents servis par le cache.
 */
const applyCachedClassifications = async (candidateFilter: Filter<IComputedJobsPartners>): Promise<number> => {
  const cursor = getDbCollection("computed_jobs_partners").find(candidateFilter, { projection: { _id: 1, partner_label: 1, partner_job_id: 1 } })
  const now = new Date()
  let applied = 0
  let group: CandidateKey[] = []

  const flush = async () => {
    if (!group.length) return
    const cached = await getCachedClassificationsByPairs(group)
    const ops: AnyBulkWriteOperation<IComputedJobsPartners>[] = []
    for (const candidate of group) {
      const label = cached.get(`${candidate.partner_label}::${candidate.partner_job_id}`)
      if (!label) continue
      ops.push({
        updateOne: {
          filter: { _id: candidate._id },
          update: {
            $set: {
              business_error: label === "unpublish" ? JOB_PARTNER_BUSINESS_ERROR.CFA : null,
              updated_at: now,
            },
            $pull: { errors: { source: COMPUTED_ERROR_SOURCE.CLASSIFICATION } },
            $addToSet: { jobs_in_success: COMPUTED_ERROR_SOURCE.CLASSIFICATION },
          },
        },
      })
    }
    if (ops.length) {
      await getDbCollection("computed_jobs_partners").bulkWrite(ops, { ordered: false })
      applied += ops.length
    }
    group = []
  }

  for await (const candidate of cursor) {
    group.push(candidate as CandidateKey)
    if (group.length >= CACHE_LOOKUP_GROUP_SIZE) await flush()
  }
  await flush()

  return applied
}

export const detectClassificationJobsPartners = async ({ addedMatchFilter }: FillComputedJobsPartnersContext) => {
  const filters: Filter<IComputedJobsPartners>[] = [{ partner_label: { $nin: PARTNER_WHITELIST } }, { workplace_siret: { $nin: GEIQ_WHITELIST } }]
  if (addedMatchFilter) {
    filters.push(addedMatchFilter)
  }

  // Prédicat partagé avec fillFieldsForComputedPartnersFactory (même helper) — nécessaire pour
  // compter les candidats avant de choisir la voie sync/batch, sans risque de divergence.
  const candidateFilter = buildComputedPartnersCandidateFilter({
    job: COMPUTED_ERROR_SOURCE.CLASSIFICATION,
    sourceFields: CLASSIFICATION_SOURCE_FIELDS,
    filledFields: CLASSIFICATION_FILLED_FIELDS,
    addedMatchFilter: { $and: filters },
  })

  // 1. Cache d'abord : les offres déjà classées sortent du périmètre sans appel externe.
  const fromCache = await applyCachedClassifications(candidateFilter)
  if (fromCache) {
    logger.info(`detectClassificationJobsPartners: ${fromCache} document(s) servi(s) par cache_classification`)
  }

  // 2. Ne reste que l'inconnu : sync en dessous du seuil, batch au-dessus.
  const candidateCount = await getDbCollection("computed_jobs_partners").countDocuments(candidateFilter)

  if (candidateCount > SYNC_BATCH_THRESHOLD) {
    logger.info(`detectClassificationJobsPartners: ${candidateCount} documents (> seuil ${SYNC_BATCH_THRESHOLD}) — routage vers le batch Mistral`)
    // Un seul aller-retour Mongo : les champs source servent à la fois à construire les requêtes
    // Mistral (submitClassificationRequests) et à récupérer les _id à marquer CLASSIFICATION_PENDING.
    const toDefer = await getDbCollection("computed_jobs_partners")
      .find(candidateFilter, { projection: { _id: 1, workplace_name: 1, workplace_description: 1, offer_title: 1, offer_description: 1 } })
      .toArray()
    const ids = toDefer.map((doc) => doc._id)
    await getDbCollection("computed_jobs_partners").updateMany(
      { _id: { $in: ids } },
      { $set: { business_error: JOB_PARTNER_BUSINESS_ERROR.CLASSIFICATION_PENDING, updated_at: new Date() } }
    )
    const jobIds = await submitClassificationRequests(toDefer)
    return { total: fromCache + ids.length, success: fromCache, error: 0, from_cache: fromCache, batched: ids.length, batches: jobIds.length }
  }

  const sync = await fillFieldsForComputedPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.CLASSIFICATION,
    sourceFields: CLASSIFICATION_SOURCE_FIELDS,
    filledFields: CLASSIFICATION_FILLED_FIELDS,
    groupSize: 50,
    addedMatchFilter: {
      $and: filters,
    },
    getData: async (documents) => {
      const payload = documents.map((document) => {
        const { workplace_description, offer_description, offer_title, workplace_name, partner_job_id, partner_label } = document
        return {
          workplace_name: workplace_name ?? undefined,
          workplace_description: workplace_description ?? undefined,
          offer_title: offer_title ?? undefined,
          offer_description: offer_description ?? undefined,
          partner_job_id,
          partner_label,
        }
      })
      const classifications = await getClassification(payload)

      return documents.map((document, index) => {
        const { _id, business_error } = document
        const classification = classifications[index]
        const result: Pick<IComputedJobsPartners, (typeof CLASSIFICATION_FILLED_FIELDS)[number] | "_id"> = {
          _id,
          business_error: classification && classification === "unpublish" ? JOB_PARTNER_BUSINESS_ERROR.CFA : business_error,
        }
        return result
      })
    },
  })

  return { ...sync, total: sync.total + fromCache, success: sync.success + fromCache, from_cache: fromCache, batched: 0, batches: 0 }
}
