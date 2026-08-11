import type { Filter } from "mongodb"
import GEIQ_WHITELIST from "shared/constants/geiq"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"
import { COMPUTED_ERROR_SOURCE, JOB_PARTNER_BUSINESS_ERROR, PARTNER_WHITELIST } from "shared/models/jobs-partners-computed.model"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { getClassification } from "@/services/cache-classification.service"
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
const SYNC_BATCH_THRESHOLD = 500

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
    await submitClassificationRequests(toDefer)
    return { total: ids.length, success: 0, error: 0 }
  }

  return fillFieldsForComputedPartnersFactory({
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
}
