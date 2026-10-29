import { ObjectId } from "mongodb"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import type { IJobsPartnersModeration, IModerationTrigger } from "shared/models/jobs-partners-moderation.model"
import { MODERATION_CLASSIFICATION_STATUS } from "shared/models/jobs-partners-moderation.model"

import { logger } from "@/common/logger"
import { maskPersonalData } from "@/common/utils/mask-personal-data"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import config from "@/config"
import { classifyOffreFreeTexts, type IOffreClassificationResult } from "./offre-classification/offre-classification.service"

/** Champs libres d'une offre LBA, sous leur nom du formulaire. */
export type IModerationTexts = { job_description: string | null; job_employer_description: string | null }

export type ITimedClassification = { result: IOffreClassificationResult; durationMs: number }

type IOfferModerationFields = Pick<IJobsPartnersOfferPrivate, "offer_moderation_verdict" | "offer_moderation_status" | "offer_moderation_review">

/** Classification des deux champs libres sous l'échéance de la configuration : au-delà, elle est indisponible. */
export const classifyOffreTexts = async (texts: IModerationTexts): Promise<ITimedClassification> => {
  const start = performance.now()
  const result = await classifyOffreFreeTexts(texts, { signal: AbortSignal.timeout(config.moderation.classificationTimeoutMs) })
  return { result, durationMs: Math.round(performance.now() - start) }
}

/**
 * Matrice de décision (#5498) : `non_conforme` et `indisponible` bloquent, `conforme` et `a_verifier` laissent le statut
 * calculé comme sans modération. Le statut est testé avant le verdict : en échec, le classifieur rend `a_verifier`.
 */
export const isBlockingClassification = ({ status, verdict }: Pick<IOffreClassificationResult, "status" | "verdict">): boolean => {
  if (status !== MODERATION_CLASSIFICATION_STATUS.OK) return true
  return verdict === "non_conforme"
}

/** Champs dénormalisés sur l'offre : chaque classification remet la décision humaine à traiter. */
export const buildOfferModerationFields = ({ verdict, status }: Pick<IOffreClassificationResult, "status" | "verdict">): IOfferModerationFields => ({
  offer_moderation_verdict: verdict,
  offer_moderation_status: status,
  offer_moderation_review: null,
})

const maskTexts = (texts: IModerationTexts): IModerationTexts => ({
  job_description: texts.job_description?.trim() ? maskPersonalData(texts.job_description.trim()) : null,
  job_employer_description: texts.job_employer_description?.trim() ? maskPersonalData(texts.job_employer_description.trim()) : null,
})

/**
 * Enregistre une classification. Avec `updateOffer`, recopie aussi son issue sur l'offre ; l'appelant qui écrit le statut
 * de l'offre dans le même update passe `false` et pose lui-même buildOfferModerationFields.
 */
export const recordClassification = async ({
  jobId,
  trigger,
  classification,
  texts,
  originalText,
  updateOffer,
  date = new Date(),
}: {
  jobId: ObjectId
  trigger: IModerationTrigger
  classification: ITimedClassification
  /** Textes transmis au classifieur, avant le masquage qu'il applique. */
  texts: IModerationTexts
  /** Texte saisi par le recruteur, null s'il est inconnu (rejeu du stock). */
  originalText: IModerationTexts | null
  updateOffer: boolean
  date?: Date
}): Promise<IJobsPartnersModeration> => {
  const { result, durationMs } = classification
  const moderation: IJobsPartnersModeration = {
    _id: new ObjectId(),
    job_id: jobId,
    trigger,
    verdict: result.verdict,
    status: result.status,
    findings: result.findings,
    original_text: originalText,
    masked_text: maskTexts(texts),
    prompt_version: result.promptVersion,
    model: result.model,
    duration_ms: durationMs,
    review: null,
    created_at: date,
  }
  await getDbCollection("jobs_partners_moderations").insertOne(moderation)
  if (updateOffer) {
    await getDbCollection("jobs_partners").updateOne({ _id: jobId }, { $set: buildOfferModerationFields(result) })
  }
  // Aucun texte ni extrait dans les logs : identifiants et issue seulement.
  logger.info({ jobId: jobId.toString(), trigger, verdict: result.verdict, status: result.status, durationMs }, "classification d'une offre LBA")
  return moderation
}

export const getLatestModeration = async (jobId: ObjectId): Promise<IJobsPartnersModeration | null> =>
  getDbCollection("jobs_partners_moderations").findOne({ job_id: jobId }, { sort: { created_at: -1 } })

/**
 * Classification sans effet sur le statut de l'offre, lancée après la réponse quand le blocage est désactivé : le dépôt
 * ne subit aucune latence. Une erreur est capturée, jamais propagée.
 */
export const classifyAndRecordInBackground = ({
  jobId,
  trigger,
  texts,
  originalText,
}: {
  jobId: ObjectId
  trigger: IModerationTrigger
  texts: IModerationTexts
  originalText: IModerationTexts | null
}): void => {
  classifyOffreTexts(texts)
    .then((classification) => recordClassification({ jobId, trigger, classification, texts, originalText, updateOffer: true }))
    .catch((error) => sentryCaptureException(error, { extra: { jobId: jobId.toString(), trigger } }))
}
