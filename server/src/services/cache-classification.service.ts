import { ObjectId } from "bson"
import { addJob } from "job-processor"
import type { IClassificationJobsPartners } from "shared/models/cache-classification.model"
import { JOB_STATUS_ENGLISH } from "shared/models/job.model"
import { COMPUTED_ERROR_SOURCE } from "shared/models/jobs-partners-computed.model"
import { getLabClassificationBatch } from "@/common/apis/classification/classification.client"
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

export const getClassificationFromLab = async (jobs: TJobClassification[]): Promise<(string | null)[]> => {
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

  const classificationsFromLab = await getLabClassificationBatch(classificationPayload)
  const classificationsById = new Map(classificationsFromLab.map((result) => [result.id, result]))

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
  partner_job_ids,
}: {
  classification: "publish" | "unpublish"
  partner_job_ids: string[]
}): Promise<void> => {
  // update cache_classification
  await getDbCollection("cache_classification").updateMany({ partner_job_id: { $in: partner_job_ids } }, { $set: { human_verification: classification } })
  // get jobs_partners to update offer_status to annulé if classification !== human_verification
  const scopeToUpdate = await getDbCollection("cache_classification")
    .find({ partner_job_id: { $in: partner_job_ids } }, { projection: { partner_job_id: 1, classification: 1, human_verification: 1 } })
    .toArray()
  // filter scopeToUpdate to keep only the jobs where classification !== human_verification
  const filteredScope = scopeToUpdate.filter(({ classification, human_verification }) => classification !== human_verification)
  const filteredScopeIds = filteredScope.map(({ partner_job_id }) => partner_job_id)

  for await (const job of filteredScope) {
    const jobPartners = await getDbCollection("jobs_partners").findOne({ partner_job_id: job.partner_job_id })
    if (jobPartners) {
      await Promise.all([
        getDbCollection("jobs_partners").updateOne(
          { partner_job_id: job.partner_job_id },
          {
            $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE, updated_at: new Date() },
            $push: {
              offer_status_history: {
                date: new Date(),
                status: JOB_STATUS_ENGLISH.ANNULEE,
                reason: "classification humaine non conforme",
                granted_by: "classification.controller",
              },
            },
          }
        ),
        getDbCollection("computed_jobs_partners").updateOne(
          { partner_job_id: job.partner_job_id },
          { $set: { business_error: null, errors: [], validated: false }, $pull: { jobs_in_success: COMPUTED_ERROR_SOURCE.CLASSIFICATION } }
        ),
      ])
      // Après l'update (le sync lit l'état post-annulation) : retrait de l'index de recherche.
      syncJobPartnersToSearchItemsInBackground([jobPartners._id])
    } else {
      const computedJobPartner = await getDbCollection("computed_jobs_partners").findOne({ partner_job_id: job.partner_job_id })
      if (computedJobPartner) {
        await getDbCollection("computed_jobs_partners").updateOne(
          { partner_job_id: job.partner_job_id },
          { $set: { business_error: null, errors: [], validated: false }, $pull: { jobs_in_success: COMPUTED_ERROR_SOURCE.CLASSIFICATION } }
        )
      }
    }
  }
  // add job to fill-computed-jobs-partners with the filteredScopeIds
  await addJob({ name: "fill-computed-jobs-partners", payload: { addedMatchFilter: { partner_job_id: { $in: filteredScopeIds } } } })
  await addJob({ name: "import-from-computed-to-jobs-partners", payload: { partner_job_id: { $in: filteredScopeIds } } })
}
