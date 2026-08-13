import type { IGetLabClassificationBatch } from "@/common/apis/classification/classification.client"
import { getMistralClassificationBatch } from "@/common/apis/classification/classification-mistral.client"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"

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
const DEFAULT_SAMPLE_SIZE = 300

export const compareLabAndMistralClassification = async (payload?: { sampleSize?: number | string }) => {
  const requestedSampleSize = Number(payload?.sampleSize)
  const sampleSize = Number.isFinite(requestedSampleSize) && requestedSampleSize > 0 ? Math.floor(requestedSampleSize) : DEFAULT_SAMPLE_SIZE

  const sample = (await getDbCollection("cache_classification")
    .aggregate([
      { $match: { human_verification: { $in: [null, ""] }, partner_label: { $ne: "recruteurs_lba" } } },
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

  logger.info(`compareLabAndMistralClassification: sample size ${sample.length} (requested ${sampleSize})`)

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
  console.table(disagreements)
  return { total: sample.length, agree, disagreements }
}

type HumanVerifiedEntry = {
  partner_job_id: string
  partner_label: string
  classification: string
  human_verification: "publish" | "unpublish"
  job: { workplace_name?: string; workplace_description?: string; offer_title?: string; offer_description?: string }
}

type ProviderError = { partner_job_id: string; partner_label: string; got: string; human_verification: string }

// Une entrée human_verification (correction manuelle, cf. reviewJobPartnersClassification) est
// une vraie vérité terrain — contrairement aux 299/319 "accords" de compareLabAndMistralClassification
// qui supposent (sans le vérifier) que Lab et Mistral ont raison quand ils sont d'accord entre eux.
const DEFAULT_HUMAN_VERIFICATION_LIMIT = 5000
// Vrai batching (comme le flux sync de production) plutôt qu'un appel Mistral par offre : ~44
// appels pour 2200 entrées au lieu de 2200, dans le même esprit que la remarque de review sur le
// batching de compareLabAndMistralClassification.
const HUMAN_VERIFIED_CHUNK_SIZE = 50

/**
 * Compare Lab et Mistral contre une vraie vérité terrain (les corrections humaines déjà
 * enregistrées dans cache_classification.human_verification), plutôt que Lab contre Mistral sans
 * référence externe. Ne modifie rien en base — usage ponctuel avant de couper le provider Lab.
 */
export const compareLabAndMistralAgainstHumanVerification = async (payload?: { limit?: number | string }) => {
  const requestedLimit = Number(payload?.limit)
  const limit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.floor(requestedLimit) : DEFAULT_HUMAN_VERIFICATION_LIMIT

  const sample = (await getDbCollection("cache_classification")
    .aggregate([
      { $match: { human_verification: { $nin: [null, ""] } } },
      { $limit: limit },
      { $lookup: { from: "jobs_partners", localField: "partner_job_id", foreignField: "partner_job_id", as: "job" } },
      { $unwind: "$job" },
      {
        $project: {
          _id: 0,
          partner_job_id: 1,
          partner_label: 1,
          classification: 1,
          human_verification: 1,
          "job.workplace_name": 1,
          "job.workplace_description": 1,
          "job.offer_title": 1,
          "job.offer_description": 1,
        },
      },
    ])
    .toArray()) as HumanVerifiedEntry[]

  logger.info(`compareLabAndMistralAgainstHumanVerification: ${sample.length} entrées human_verification (limite ${limit}), lots de ${HUMAN_VERIFIED_CHUNK_SIZE}`)

  const counters = { total: 0, labCorrect: 0, mistralCorrect: 0, bothCorrect: 0, bothWrong: 0, onlyLabCorrect: 0, onlyMistralCorrect: 0, mistralCallFailures: 0 }
  const labErrors: ProviderError[] = []
  const mistralErrors: ProviderError[] = []

  for (let i = 0; i < sample.length; i += HUMAN_VERIFIED_CHUNK_SIZE) {
    const chunk = sample.slice(i, i + HUMAN_VERIFIED_CHUNK_SIZE)
    const jobs: IGetLabClassificationBatch = chunk.map((entry, index) => ({
      id: index.toString(),
      workplace_name: entry.job.workplace_name ?? undefined,
      workplace_description: entry.job.workplace_description ?? undefined,
      offer_title: entry.job.offer_title ?? undefined,
      offer_description: entry.job.offer_description ?? undefined,
    }))

    let mistralResults: Awaited<ReturnType<typeof getMistralClassificationBatch>>
    try {
      mistralResults = await getMistralClassificationBatch(jobs)
    } catch (err) {
      // Un lot en échec (après le retry déjà géré par getMistralClassificationBatch) est ignoré —
      // pas de quoi interrompre une comparaison de plusieurs milliers d'entrées pour un seul lot.
      sentryCaptureException(err)
      logger.error(`compareLabAndMistralAgainstHumanVerification: lot ${i}-${i + chunk.length} ignoré (échec Mistral)`)
      counters.mistralCallFailures += chunk.length
      continue
    }

    chunk.forEach((entry, index) => {
      counters.total++
      const mistralLabel = mistralResults[index]?.label
      const labOk = entry.classification === entry.human_verification
      const mistralOk = mistralLabel === entry.human_verification

      if (labOk) counters.labCorrect++
      else labErrors.push({ partner_job_id: entry.partner_job_id, partner_label: entry.partner_label, got: entry.classification, human_verification: entry.human_verification })

      if (mistralOk) counters.mistralCorrect++
      else if (mistralLabel)
        mistralErrors.push({ partner_job_id: entry.partner_job_id, partner_label: entry.partner_label, got: mistralLabel, human_verification: entry.human_verification })

      if (labOk && mistralOk) counters.bothCorrect++
      else if (!labOk && !mistralOk) counters.bothWrong++
      else if (labOk) counters.onlyLabCorrect++
      else counters.onlyMistralCorrect++
    })

    logger.info(`compareLabAndMistralAgainstHumanVerification: ${Math.min(i + chunk.length, sample.length)}/${sample.length} traités`)
  }

  const labAccuracy = counters.total ? counters.labCorrect / counters.total : 0
  const mistralAccuracy = counters.total ? counters.mistralCorrect / counters.total : 0

  // Sous-total distinct de labAccuracy/mistralAccuracy : uniquement les cas où Lab s'est trompé
  // (classification !== human_verification, donc Lab est faux par construction sur ce sous-
  // ensemble — ce n'est PAS une mesure de précision, seulement un taux de rattrapage). Répond à
  // "sur les erreurs déjà connues de Lab, combien Mistral en rattrape-t-il indépendamment ?".
  const knownLabErrors = counters.total - counters.labCorrect
  const knownLabErrorsCaughtByMistral = counters.onlyMistralCorrect
  const knownLabErrorCatchRate = knownLabErrors ? knownLabErrorsCaughtByMistral / knownLabErrors : 0

  logger.info(
    `compareLabAndMistralAgainstHumanVerification: Lab ${counters.labCorrect}/${counters.total} (${(labAccuracy * 100).toFixed(1)}%), ` +
      `Mistral ${counters.mistralCorrect}/${counters.total} (${(mistralAccuracy * 100).toFixed(1)}%)`
  )
  logger.info(
    `compareLabAndMistralAgainstHumanVerification: sur les ${knownLabErrors} erreurs connues de Lab, Mistral en rattrape ${knownLabErrorsCaughtByMistral} (${(knownLabErrorCatchRate * 100).toFixed(1)}%)`
  )
  console.table([
    { provider: "lab", correct: counters.labCorrect, total: counters.total, accuracy: `${(labAccuracy * 100).toFixed(1)}%` },
    { provider: "mistral", correct: counters.mistralCorrect, total: counters.total, accuracy: `${(mistralAccuracy * 100).toFixed(1)}%` },
  ])
  console.table([
    {
      bothCorrect: counters.bothCorrect,
      bothWrong: counters.bothWrong,
      onlyLabCorrect: counters.onlyLabCorrect,
      onlyMistralCorrect: counters.onlyMistralCorrect,
      mistralCallFailures: counters.mistralCallFailures,
    },
  ])
  console.table([{ knownLabErrors, knownLabErrorsCaughtByMistral, knownLabErrorCatchRate: `${(knownLabErrorCatchRate * 100).toFixed(1)}%` }])

  return { ...counters, labAccuracy, mistralAccuracy, knownLabErrors, knownLabErrorsCaughtByMistral, knownLabErrorCatchRate, labErrors, mistralErrors }
}
