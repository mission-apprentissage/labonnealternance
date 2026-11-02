import type { Filter, ObjectId } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared/models/job.model"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { IModerationTrigger } from "shared/models/jobs-partners-moderation.model"
import { MODERATION_CLASSIFICATION_STATUS, MODERATION_TRIGGER, OFFER_MODERATION_STATUS } from "shared/models/jobs-partners-moderation.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { applyStoredOfferClassification, getStoredModerationTexts } from "@/services/formulaire.service"
import { classifyOffreTexts } from "@/services/jobs-partners-moderation.service"
import { alertClassifierIndisponible, alertClassifierRetryEpuise } from "@/services/jobs-partners-moderation-alerts"

export const RETRY_CLASSIFICATION_JOB_NAME = "retry-classification-indisponible"
export const REPRISE_CLASSIFICATION_JOB_NAME = "reprise-classification-epuisee"

/** Attente avant chaque nouvelle tentative, depuis la précédente ; après la dernière, l'offre passe `epuise`. */
export const RETRY_DELAYS_MS = [5, 20, 60].map((minutes) => minutes * 60 * 1000)

const UNAVAILABLE_ALERT_WINDOW_MS = 60 * 60 * 1000

/** Nouvelles tentatives échouées depuis le dernier dépôt, la dernière édition ou la dernière reprise, et date de la plus récente classification. */
const getRetryState = async (jobId: ObjectId) => {
  const moderations = await getDbCollection("jobs_partners_moderations")
    .find({ job_id: jobId }, { sort: { created_at: -1 }, limit: RETRY_DELAYS_MS.length + 1, projection: { trigger: 1, status: 1, created_at: 1 } })
    .toArray()
  const failedRetries = moderations.findIndex(({ trigger, status }) => trigger !== MODERATION_TRIGGER.RETRY || status !== MODERATION_CLASSIFICATION_STATUS.INDISPONIBLE)
  return { failedRetries: failedRetries === -1 ? moderations.length : failedRetries, lastClassifiedAt: moderations.at(0)?.created_at ?? null }
}

type IAttempt = { offer: IJobsPartnersOfferPrivate; isLastRetry: boolean }

/**
 * Une tentative par offre, dans l'ordre. Circuit breaker : si le premier appel est indisponible, le classifieur l'est
 * pour les suivantes, l'exécution s'arrête sans consommer le quota de la clé Mistral, partagée avec d'autres usages.
 */
const runAttempts = async ({ attempts, trigger, jobName }: { attempts: IAttempt[]; trigger: IModerationTrigger; jobName: string }) => {
  const stats = { attempted: 0, released: 0, blocked: 0, unavailable: 0, circuitOpen: false }
  const exhausted: IJobsPartnersOfferPrivate[] = []
  for (const { offer, isLastRetry } of attempts) {
    const classification = await classifyOffreTexts(getStoredModerationTexts(offer))
    const isUnavailable = classification.result.status === MODERATION_CLASSIFICATION_STATUS.INDISPONIBLE
    const { released } = await applyStoredOfferClassification({
      offer,
      trigger,
      classification,
      grantedBy: jobName,
      offerModerationStatus: isLastRetry ? OFFER_MODERATION_STATUS.EPUISE : undefined,
    })
    stats.attempted++
    if (released) stats.released++
    else if (isUnavailable) stats.unavailable++
    else stats.blocked++
    if (isUnavailable && isLastRetry && trigger === MODERATION_TRIGGER.RETRY) exhausted.push(offer)
    if (isUnavailable && stats.attempted === 1) {
      stats.circuitOpen = true
      break
    }
  }
  return { stats, exhausted }
}

/**
 * Nouvelle tentative pour les offres bloquées faute de classification (#5498), toutes les 5 min. Le backlog est lu
 * par état, jamais dans une file : une panne longue ne laisse aucune offre de côté.
 */
export const retryUnavailableClassifications = async ({ now = new Date() }: { now?: Date } = {}) => {
  const offers = await getDbCollection("jobs_partners")
    .find({
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      offer_status: JOB_STATUS_ENGLISH.EN_MODERATION,
      offer_moderation_status: OFFER_MODERATION_STATUS.INDISPONIBLE,
    })
    .toArray()

  const due: (IAttempt & { lastClassifiedAt: number })[] = []
  for (const offer of offers) {
    const { failedRetries, lastClassifiedAt } = await getRetryState(offer._id)
    if (failedRetries >= RETRY_DELAYS_MS.length) {
      // Dernière tentative enregistrée sans que l'offre soit passée `epuise` (exécution interrompue) : rattrapage.
      await getDbCollection("jobs_partners").updateOne(
        { _id: offer._id, offer_status: JOB_STATUS_ENGLISH.EN_MODERATION },
        { $set: { offer_moderation_status: OFFER_MODERATION_STATUS.EPUISE } }
      )
      continue
    }
    const lastAt = lastClassifiedAt?.getTime() ?? 0
    if (lastAt + RETRY_DELAYS_MS[failedRetries] <= now.getTime()) {
      due.push({ offer, isLastRetry: failedRetries + 1 >= RETRY_DELAYS_MS.length, lastClassifiedAt: lastAt })
    }
  }
  // La plus en retard d'abord : avec le circuit breaker, chaque exécution d'une panne essaie une autre offre.
  due.sort((a, b) => a.lastClassifiedAt - b.lastClassifiedAt)

  const unavailableAlertedRecently = await getDbCollection("jobs_partners_moderations").findOne({
    trigger: MODERATION_TRIGGER.RETRY,
    status: MODERATION_CLASSIFICATION_STATUS.INDISPONIBLE,
    created_at: { $gte: new Date(now.getTime() - UNAVAILABLE_ALERT_WINDOW_MS) },
  })
  const { stats, exhausted } = await runAttempts({ attempts: due, trigger: MODERATION_TRIGGER.RETRY, jobName: RETRY_CLASSIFICATION_JOB_NAME })

  // Une alerte par heure de panne au plus : une tentative échouée dans l'heure précédente vaut alerte déjà émise.
  if (stats.circuitOpen && !unavailableAlertedRecently) {
    await alertClassifierIndisponible({ jobName: RETRY_CLASSIFICATION_JOB_NAME, pendingCount: offers.length })
  }
  if (exhausted.length) {
    await alertClassifierRetryEpuise(exhausted)
  }
  const result = { pending: offers.length, due: due.length, ...stats }
  logger.info(result, "nouvelle tentative de classification des offres bloquées")
  return result
}

export const REPRISE_CLASSIFICATION_FILTER: Filter<IJobsPartnersOfferPrivate> = {
  partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
  $or: [
    { offer_status: JOB_STATUS_ENGLISH.EN_MODERATION, offer_moderation_status: OFFER_MODERATION_STATUS.EPUISE },
    // Classifiée en échec et publiée, blocage désactivé : aucune nouvelle tentative ne la reprend.
    {
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      offer_moderation_status: { $in: [OFFER_MODERATION_STATUS.INDISPONIBLE, OFFER_MODERATION_STATUS.EPUISE] },
      offer_moderation_review: null,
    },
  ],
}

/**
 * Reprise quotidienne des offres dont toutes les nouvelles tentatives ont échoué : une tentative chacune. C'est la
 * garantie de résorption du backlog après une panne longue. Une offre `epuise` ne se publie que sur un verdict réel
 * ou une décision humaine. Lancée aussi par la relance en masse de la modération (#5499).
 */
export const repriseExhaustedClassifications = async () => {
  const offers = await getDbCollection("jobs_partners")
    .find(REPRISE_CLASSIFICATION_FILTER, { sort: { updated_at: 1 } })
    .toArray()

  const { stats } = await runAttempts({
    attempts: offers.map((offer) => ({ offer, isLastRetry: true })),
    trigger: MODERATION_TRIGGER.REPRISE,
    jobName: REPRISE_CLASSIFICATION_JOB_NAME,
  })
  if (stats.circuitOpen) {
    await alertClassifierIndisponible({ jobName: REPRISE_CLASSIFICATION_JOB_NAME, pendingCount: offers.length })
  }
  const result = { pending: offers.length, ...stats }
  logger.info(result, "reprise de la classification des offres bloquées")
  return result
}
