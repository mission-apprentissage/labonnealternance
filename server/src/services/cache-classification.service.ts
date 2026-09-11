import { ObjectId } from "bson"
import { addJob } from "job-processor"
import type { IClassificationJobsPartners } from "shared/models/cache-classification.model"
import { JOB_STATUS_ENGLISH } from "shared/models/job.model"
import { COMPUTED_ERROR_SOURCE } from "shared/models/jobs-partners-computed.model"
import { getMistralClassificationBatch } from "@/common/apis/classification/classification-mistral.client"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { syncJobPartnersToSearchItemsInBackground } from "@/services/search/search-items.service"

export type TJobClassification = {
  partner_label: string
  partner_job_id: string
  workplace_name?: string
  workplace_description?: string
  offer_title?: string
  offer_description?: string
}

const getClassificationFromDB = async (jobs: TJobClassification[]): Promise<(IClassificationJobsPartners | null)[]> => {
  const queries = jobs.map((job) => ({ partner_label: job.partner_label, partner_job_id: job.partner_job_id }))
  const results = await getDbCollection("cache_classification").find({ $or: queries }).toArray()
  return jobs.map((job) => {
    return results.find((result) => result.partner_label === job.partner_label && result.partner_job_id === job.partner_job_id) ?? null
  })
}

/**
 * Lecture du cache par couples (partner_label, partner_job_id), un `$in` par partenaire — servi par
 * l'index {partner_job_id, partner_label}. Clé de la Map : `${partner_label}::${partner_job_id}`.
 * La classification humaine prime sur celle du modèle, comme dans getClassification.
 */
export const getCachedClassificationsByPairs = async (pairs: { partner_label: string; partner_job_id: string }[]): Promise<Map<string, string>> => {
  const result = new Map<string, string>()
  if (!pairs.length) return result

  const idsByPartner = new Map<string, string[]>()
  for (const { partner_label, partner_job_id } of pairs) {
    const ids = idsByPartner.get(partner_label) ?? []
    ids.push(partner_job_id)
    idsByPartner.set(partner_label, ids)
  }

  for (const [partner_label, partner_job_ids] of idsByPartner) {
    const cached = await getDbCollection("cache_classification")
      .find({ partner_label, partner_job_id: { $in: partner_job_ids } }, { projection: { partner_label: 1, partner_job_id: 1, classification: 1, human_verification: 1 } })
      .toArray()
    for (const entry of cached) {
      result.set(`${entry.partner_label}::${entry.partner_job_id}`, entry.human_verification ?? entry.classification)
    }
  }

  return result
}

export const getClassification = async (jobs: TJobClassification[]): Promise<(string | null)[]> => {
  const cachedClassifications = await getClassificationFromDB(jobs)
  const notFoundJobs = jobs.flatMap((job, index) => {
    if (cachedClassifications[index] !== null) {
      return []
    }

    return [{ job, index }]
  })

  if (!notFoundJobs.length) {
    return cachedClassifications.map((cached) => (cached?.human_verification ? cached.human_verification : (cached?.classification ?? null)))
  }

  const classificationPayload = notFoundJobs.map(({ job, index }) => ({
    id: index.toString(),
    workplace_name: job.workplace_name,
    workplace_description: job.workplace_description,
    offer_title: job.offer_title,
    offer_description: job.offer_description,
  }))

  const classificationsFromProvider = await getMistralClassificationBatch(classificationPayload)
  const classificationsById = new Map(classificationsFromProvider.map((result) => [result.id, result]))

  const now = new Date()
  const zippedJobsNotFound = notFoundJobs.flatMap(({ job, index }) => {
    const result = classificationsById.get(index.toString())
    if (!result) return []

    return [
      {
        index,
        dbClassification: {
          _id: new ObjectId(),
          partner_label: job.partner_label,
          partner_job_id: job.partner_job_id,
          classification: result.label,
          scores: result.scores,
          model: result.model,
          created_at: now,
        },
        classificationResult: result,
      },
    ]
  })

  if (zippedJobsNotFound.length) {
    const payloads = zippedJobsNotFound.map(({ dbClassification }) => dbClassification)
    await getDbCollection("cache_classification").insertMany(payloads)
  }

  // Return results in the same order as input jobs
  return jobs.map((_job, index) => {
    const cached = cachedClassifications[index]
    if (cached) {
      return cached.human_verification ? cached.human_verification : cached.classification
    }

    return classificationsById.get(index.toString())?.label ?? null
  })
}

export const updateClassificationAndSynchronise = async ({
  classification,
  jobs,
  grantedBy = "cache-classification.service",
}: {
  classification: "publish" | "unpublish"
  jobs: { partner_label: string; partner_job_id: string }[]
  grantedBy?: string
}): Promise<void> => {
  if (!jobs.length) return

  // cache_classification n'est pas unique sur partner_job_id seul : un même partner_job_id peut exister chez plusieurs
  // partenaires, donc on filtre systématiquement sur le couple (partner_label, partner_job_id) pour ne jamais toucher
  // l'entrée d'un autre partenaire.
  const jobsFilter = { $or: jobs.map(({ partner_label, partner_job_id }) => ({ partner_label, partner_job_id })) }

  // update cache_classification
  await getDbCollection("cache_classification").updateMany(jobsFilter, { $set: { human_verification: classification } })
  // get jobs_partners to update offer_status to annulé if classification !== human_verification
  const scopeToUpdate = await getDbCollection("cache_classification")
    .find(jobsFilter, { projection: { partner_label: 1, partner_job_id: 1, classification: 1, human_verification: 1 } })
    .toArray()
  // filter scopeToUpdate to keep only the jobs where classification !== human_verification
  const filteredScope = scopeToUpdate.filter(({ classification, human_verification }) => classification !== human_verification)

  for await (const entry of filteredScope) {
    const jobPartners = await getDbCollection("jobs_partners").findOne({ partner_label: entry.partner_label, partner_job_id: entry.partner_job_id })
    if (jobPartners) {
      await Promise.all([
        getDbCollection("jobs_partners").updateOne(
          { partner_label: entry.partner_label, partner_job_id: entry.partner_job_id },
          {
            $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE, updated_at: new Date() },
            $push: {
              offer_status_history: {
                date: new Date(),
                status: JOB_STATUS_ENGLISH.ANNULEE,
                reason: "classification humaine non conforme",
                granted_by: grantedBy,
              },
            },
          }
        ),
        getDbCollection("computed_jobs_partners").updateOne(
          { partner_label: entry.partner_label, partner_job_id: entry.partner_job_id },
          { $set: { business_error: null, errors: [], validated: false }, $pull: { jobs_in_success: COMPUTED_ERROR_SOURCE.CLASSIFICATION } }
        ),
      ])
      // Après l'update (le sync lit l'état post-annulation) : retrait de l'index de recherche.
      syncJobPartnersToSearchItemsInBackground([jobPartners._id])
    } else {
      const computedJobPartner = await getDbCollection("computed_jobs_partners").findOne({ partner_label: entry.partner_label, partner_job_id: entry.partner_job_id })
      if (computedJobPartner) {
        await getDbCollection("computed_jobs_partners").updateOne(
          { partner_label: entry.partner_label, partner_job_id: entry.partner_job_id },
          { $set: { business_error: null, errors: [], validated: false }, $pull: { jobs_in_success: COMPUTED_ERROR_SOURCE.CLASSIFICATION } }
        )
      }
    }
  }

  if (filteredScope.length) {
    const filteredScopeFilter = { $or: filteredScope.map(({ partner_label, partner_job_id }) => ({ partner_label, partner_job_id })) }
    // Ré-exécute la chaîne de traitement (validation + import vers jobs_partners) pour les seules
    // offres concernées. `queued: true` pour ne pas bloquer l'appelant (endpoint admin HTTP ou
    // CLI) sur un pipeline potentiellement long. Le nom doit être le nom JS exact de la fonction
    // (`processJobPartnersWithFilter`, enregistrée dans simple-job-definitions.ts) — d'anciens
    // noms kebab-case ("fill-computed-jobs-partners", "import-from-computed-to-jobs-partners") ne
    // correspondaient à aucun handler enregistré et échouaient silencieusement en prod ("Job not
    // found", confirmé via Sentry sur ~16 occurrences en 13 jours avant correctif).
    await addJob({ name: "processJobPartnersWithFilter", payload: filteredScopeFilter, queued: true })
  }
}

/** Point d'entrée CLI (`yarn cli reviewJobPartnersClassification --classification publish
 * --partnerLabel Hellowork --partnerJobIds job1,job2`) pour corriger manuellement la
 * classification de plusieurs offres d'un même partenaire en une fois — complète l'écran admin
 * (POST /admin/jobs-partners/:id/classification, un id à la fois) pour les corrections en lot. */
export const reviewJobPartnersClassification = async (payload?: { classification?: string; partnerLabel?: string; partnerJobIds?: string }) => {
  const { classification, partnerLabel, partnerJobIds } = payload ?? {}
  if (classification !== "publish" && classification !== "unpublish") {
    throw new Error(`reviewJobPartnersClassification: --classification invalide (attendu "publish" ou "unpublish", reçu ${classification})`)
  }
  if (!partnerLabel) {
    throw new Error("reviewJobPartnersClassification: --partnerLabel requis")
  }
  const ids = (partnerJobIds ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
  if (!ids.length) {
    throw new Error("reviewJobPartnersClassification: --partnerJobIds requis (liste de partner_job_id séparés par des virgules)")
  }
  return updateClassificationAndSynchronise({
    classification,
    jobs: ids.map((partner_job_id) => ({ partner_label: partnerLabel, partner_job_id })),
    grantedBy: "cli:reviewJobPartnersClassification",
  })
}
