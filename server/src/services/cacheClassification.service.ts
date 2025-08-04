import { ObjectId } from "bson"
import { IClassificationJobsPartners } from "shared/models/cacheClassification.model"

import { getLabClassificationBatch } from "@/common/apis/classification/classification.client"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export type TJobClassification = {
  partner_label: string
  partner_job_id: string
  workplace_name: string
  workplace_description: string
  offer_title: string
  offer_description: string
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
    return cachedClassifications.map((cached) => cached?.classification ?? null)
  }

  const classificationPayload = notFoundJobs.map((job) => ({
    id: `${job.partner_label}_${job.partner_job_id}`,
    text: [job.workplace_name, job.workplace_description, job.offer_title, job.offer_description].filter(Boolean).join("\n"),
  }))

  const classificationsFromLab = await getLabClassificationBatch(classificationPayload)

  if (classificationsFromLab && classificationsFromLab.length) {
    const payloads = notFoundJobs
      .map((job, idx) => ({
        _id: new ObjectId(),
        partner_label: job.partner_label,
        partner_job_id: job.partner_job_id,
        classification: classificationsFromLab[idx]?.label,
        scores: classificationsFromLab[idx]?.scores,
      }))
      .filter((payload) => payload.classification)

    if (payloads.length > 0) {
      await getDbCollection("cache_classification").insertMany(payloads)
    }
  }

  return jobs.map((job, index) => {
    const cached = cachedClassifications[index]
    if (cached) return cached.classification

    const notFoundJobIndex = notFoundJobs.findIndex((nfJob) => nfJob.partner_label === job.partner_label && nfJob.partner_job_id === job.partner_job_id)
    if (notFoundJobIndex >= 0 && classificationsFromLab && classificationsFromLab[notFoundJobIndex]) {
      return classificationsFromLab[notFoundJobIndex].label
    }

    return null
  })
}
