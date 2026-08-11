import type { IGetLabClassificationBatch } from "@/common/apis/classification/classification.client"
import { getMistralClassificationBatch } from "@/common/apis/classification/classification-mistral.client"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"

type SampleEntry = {
  partner_job_id: string
  partner_label: string
  classification: string
  job: { workplace_name?: string; workplace_description?: string; offer_title?: string; offer_description?: string }
}

type ClassificationDisagreement = { partner_job_id: string; partner_label: string; lab: string; mistral: string }

/**
 * Rejoue un échantillon de cache_classification déjà classifié par Lab (hors corrections
 * humaines, pour comparer sur des décisions non déjà validées à la main) à travers Mistral, sans
 * rien modifier en base. Usage ponctuel avant de couper le provider Lab (voir plan de migration).
 */
export const compareLabAndMistralClassification = async (payload?: { sampleSize?: number | string }) => {
  const sampleSize = Number(payload?.sampleSize ?? 200)

  const sample = (await getDbCollection("cache_classification")
    .aggregate([
      { $match: { human_verification: { $in: [null, ""] } } },
      { $sample: { size: sampleSize } },
      { $lookup: { from: "jobs_partners", localField: "partner_job_id", foreignField: "partner_job_id", as: "job" } },
      { $unwind: "$job" },
      {
        $project: {
          _id: 0,
          partner_job_id: 1,
          partner_label: 1,
          classification: 1,
          "job.workplace_name": 1,
          "job.workplace_description": 1,
          "job.offer_title": 1,
          "job.offer_description": 1,
        },
      },
    ])
    .toArray()) as SampleEntry[]

  let agree = 0
  const disagreements: ClassificationDisagreement[] = []

  for (const entry of sample) {
    const job: IGetLabClassificationBatch = [
      {
        id: entry.partner_job_id,
        workplace_name: entry.job.workplace_name ?? undefined,
        workplace_description: entry.job.workplace_description ?? undefined,
        offer_title: entry.job.offer_title ?? undefined,
        offer_description: entry.job.offer_description ?? undefined,
      },
    ]
    const [mistralResult] = await getMistralClassificationBatch(job)
    if (mistralResult.label === entry.classification) {
      agree++
    } else {
      disagreements.push({ partner_job_id: entry.partner_job_id, partner_label: entry.partner_label, lab: entry.classification, mistral: mistralResult.label })
    }
  }

  logger.info(`compareLabAndMistralClassification: ${agree}/${sample.length} accords (${disagreements.length} désaccords)`)
  return { total: sample.length, agree, disagreements }
}
