import { JOB_STATUS_ENGLISH, OFFER_DESCRIPTION_MODE } from "shared/models/job.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { IModerationVerdict } from "shared/models/jobs-partners-moderation.model"
import { MODERATION_CLASSIFICATION_STATUS, MODERATION_TRIGGER } from "shared/models/jobs-partners-moderation.model"

import { logger } from "@/common/logger"
import { asyncForEachGrouped } from "@/common/utils/async-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { getStoredModerationTexts } from "@/services/formulaire.service"
import { classifyOffreTexts, recordClassification } from "@/services/jobs-partners-moderation.service"

const percentile = (sorted: number[], p: number) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)] : null)

const parsePositiveInt = (value: number | string | undefined, option: string, fallback: number): number => {
  if (value === undefined) return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${option} attend un entier supérieur ou égal à 1, reçu ${value}`)
  }
  return parsed
}

/**
 * Rejoue le classifieur sur les offres LBA actives à texte libre, à la main (#5497). Écrit seulement dans
 * jobs_partners_moderations : ni le statut des offres ni leurs champs de modération ne changent, le stock n'entre pas
 * dans la file de revue. Concurrence basse par défaut : la clé Mistral est partagée avec les autres usages.
 */
export const rejeuClassificationOffres = async (payload?: { limit?: number | string; concurrency?: number | string }) => {
  // 0 : pas de limite pour MongoDB.
  const limit = parsePositiveInt(payload?.limit, "--limit", 0)
  const concurrency = parsePositiveInt(payload?.concurrency, "--concurrency", 2)
  const offers = await getDbCollection("jobs_partners")
    .find(
      {
        partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
        offer_status: JOB_STATUS_ENGLISH.ACTIVE,
        $or: [{ offer_description_mode: OFFER_DESCRIPTION_MODE.CUSTOM }, { workplace_description: { $nin: [null, ""] } }],
      },
      { projection: { offer_description: 1, offer_description_mode: 1, workplace_description: 1 }, sort: { created_at: -1 }, limit }
    )
    .toArray()

  const verdicts: Record<IModerationVerdict | "indisponible", number> = { conforme: 0, a_verifier: 0, non_conforme: 0, indisponible: 0 }
  const durations: number[] = []
  await asyncForEachGrouped(offers, concurrency, async (offer) => {
    const texts = getStoredModerationTexts(offer)
    const classification = await classifyOffreTexts(texts)
    await recordClassification({ jobId: offer._id, trigger: MODERATION_TRIGGER.REJEU, classification, texts, originalText: null, updateOffer: false })
    const { status, verdict } = classification.result
    verdicts[status === MODERATION_CLASSIFICATION_STATUS.OK ? verdict : "indisponible"]++
    durations.push(classification.durationMs)
  })

  durations.sort((a, b) => a - b)
  const result = {
    selected: offers.length,
    classified: durations.length,
    verdicts,
    latencyMs: { p50: percentile(durations, 50), p95: percentile(durations, 95), max: durations.at(-1) ?? null },
  }
  logger.info(result, "rejeu du classifieur sur les offres LBA actives")
  return result
}
