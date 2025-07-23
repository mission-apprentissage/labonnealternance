import { ObjectId } from "bson"
import { IClassificationJobsPartners } from "shared/models/cacheClassification.model"

import { getLabClassification } from "@/common/apis/classification/classification.client"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export type TJobClassification = {
  partner_label: string
  partner_job_id: string
  workplace_name: string
  workplace_description: string
  offer_title: string
  offer_description: string
}

const getClassificationFromDB = async (job: TJobClassification): Promise<IClassificationJobsPartners | null> => {
  const classification = await getDbCollection("cache_classification").findOne({ partner_label: job.partner_label, partner_job_id: job.partner_job_id })
  return classification ?? null
}

export const getClassificationFromLab = async (job: TJobClassification): Promise<string | null> => {
  const classificationString = [job.workplace_name, job.workplace_description, job.offer_title, job.offer_description].filter(Boolean).join("\n")
  const classificationFromCache = await getClassificationFromDB(job)
  if (classificationFromCache) return classificationFromCache.classification
  const classificationFromLab = await getLabClassification(classificationString)
  if (classificationFromLab) {
    const payload: IClassificationJobsPartners = {
      _id: new ObjectId(),
      partner_label: job.partner_label,
      partner_job_id: job.partner_job_id,
      classification: classificationFromLab.label,
      scores: classificationFromLab.scores,
    }
    await getDbCollection("cache_classification").insertOne(payload)
    return classificationFromLab.label
  }
  return null
}
