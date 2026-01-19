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
    return [{ ...job, originalIndex: index }]
  })

  if (!notFoundJobs.length) {
    return cachedClassifications.map((cached) => (cached?.human_verification ? cached.human_verification : (cached?.classification ?? null)))
  }

  const classificationPayload = notFoundJobs.map((job) => ({
    id: job.partner_job_id,
    text: [job.workplace_name, job.workplace_description, job.offer_title, job.offer_description].filter(Boolean).join("\n"),
  }))

  const classificationsFromLab = await getLabClassificationBatch(classificationPayload)

  // Create a map from job ID to classification result for safe lookup
  const classificationMap = new Map<string, { label: string; scores: any }>()
  if (classificationsFromLab && classificationsFromLab.length) {
    classificationsFromLab.forEach((result) => {
      if (result?.label && result?.id) {
        classificationMap.set(result.id, { label: result.label, scores: result.scores })
      }
    })

    // Save to database using the map for safe lookups
    const payloads = notFoundJobs
      .map((job) => {
        const result = classificationMap.get(job.partner_job_id)
        if (!result) return null

        return {
          _id: new ObjectId(),
          partner_label: job.partner_label,
          partner_job_id: job.partner_job_id,
          classification: result.label,
          scores: result.scores,
        }
      })
      .filter((payload): payload is NonNullable<typeof payload> => payload !== null)

    if (payloads.length > 0) {
      await getDbCollection("cache_classification").insertMany(payloads)
    }
  }

  // Return results in the same order as input jobs
  return jobs.map((job, index) => {
    const cached = cachedClassifications[index]
    if (cached) return cached.classification

    // Use the map for safe lookup
    const result = classificationMap.get(job.partner_job_id)
    return result?.label ?? null
  })
}
