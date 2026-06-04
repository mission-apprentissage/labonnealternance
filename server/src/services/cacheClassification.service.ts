import { ObjectId } from "bson"
import type { IClassificationJobsPartners } from "shared/models/cacheClassification.model"
import { getLabClassificationBatch } from "@/common/apis/classification/classification.client"
import { getDbCollection } from "@/common/utils/mongodbUtils"

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

  const newClassificationsByIndex = new Map(zippedJobsNotFound.map(({ index, classificationResult }) => [index, classificationResult.label]))

  // Return results in the same order as input jobs
  return jobs.map((_job, index) => {
    const cached = cachedClassifications[index]
    if (cached) {
      return cached.human_verification ? cached.human_verification : cached.classification
    }

    return newClassificationsByIndex.get(index) ?? null
  })
}
