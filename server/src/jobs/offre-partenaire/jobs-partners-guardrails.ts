import type { IJobsCronTask } from "job-processor"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"

import { logger } from "@/common/logger"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"

export const GUARDRAIL_ERROR_MARKER = "[garde-fou]"

export type GuardrailThresholds = {
  /** Part maximale d'offres en erreur zod/mapper parmi les offres transformables (succès + erreurs). */
  maxTransformationErrorRate: number
  /** Nombre d'erreurs de transformation en dessous duquel le seuil ne bloque pas : sur un petit flux, une erreur suffit à dépasser le taux. */
  minTransformationErrorCountToBlock: number
  /** Part maximale des offres actives d'un partenaire sorties du flux depuis le run précédent. */
  maxRemovedCancellationRate: number
  /** Nombre d'annulations en dessous duquel le garde-fou d'annulation ne bloque pas : sur un petit catalogue, un pourcentage ne dit rien. */
  minRemovedCountToBlock: number
}

// Calées sur 30 jours de prod (#5668) : hors incidents, aucune annulation par run au-delà de 25 % ni erreur de transformation au-delà de 20 %.
export const DEFAULT_GUARDRAIL_THRESHOLDS: GuardrailThresholds = {
  maxTransformationErrorRate: 0.2,
  minTransformationErrorCountToBlock: 10,
  maxRemovedCancellationRate: 0.3,
  minRemovedCountToBlock: 10,
}

// Gros catalogues : 4 à 8 % des offres actives sortent du flux d'une nuit à l'autre (prod, novembre 2026), un seuil à 5 %
// bloque sur ce renouvellement normal. À 30 %, la perte de 900 offres France Travail passerait.
const STABLE_LARGE_FLUX_THRESHOLDS: Partial<GuardrailThresholds> = { maxRemovedCancellationRate: 0.15 }

/** Délai au terme duquel une offre restée hors du flux après un blocage est annulée sans intervention (cf. cancelRemovedJobsPartners). */
export const REMOVAL_GRACE_DAYS = 3

export const GUARDRAIL_THRESHOLDS_BY_PARTNER: Partial<Record<string, Partial<GuardrailThresholds>>> = {
  [JOBPARTNERS_LABEL.FRANCE_TRAVAIL]: STABLE_LARGE_FLUX_THRESHOLDS,
  [JOBPARTNERS_LABEL.HELLOWORK]: STABLE_LARGE_FLUX_THRESHOLDS,
  [JOBPARTNERS_LABEL.METEOJOB]: STABLE_LARGE_FLUX_THRESHOLDS,
  [JOBPARTNERS_LABEL.RH_ALTERNANCE]: STABLE_LARGE_FLUX_THRESHOLDS,
  [JOBPARTNERS_LABEL.NOS_TALENTS_NOS_EMPLOIS]: STABLE_LARGE_FLUX_THRESHOLDS,
  [JOBPARTNERS_LABEL.PASS]: STABLE_LARGE_FLUX_THRESHOLDS,
}

export const getGuardrailThresholds = (partnerLabel: string): GuardrailThresholds => ({
  ...DEFAULT_GUARDRAIL_THRESHOLDS,
  ...GUARDRAIL_THRESHOLDS_BY_PARTNER[partnerLabel],
})

/** Blocage volontaire par un garde-fou : le job sort en erreur et le bilan nocturne le repère à son marqueur. */
export class JobPartnersGuardrailError extends Error {
  constructor(message: string) {
    super(`${GUARDRAIL_ERROR_MARKER} ${message}`)
    this.name = "JobPartnersGuardrailError"
  }
}

export const formatRate = (rate: number) => `${Math.round(rate * 1000) / 10} %`

export type GuardrailBlock = { jobName: string; detail: string; at: number }

/** Blocages par garde-fou de la période, le plus récent par job, repérés au marqueur de leur erreur. */
export const getLatestGuardrailBlocks = (jobs: IJobsCronTask[]): GuardrailBlock[] => {
  const latestBlockByJob = new Map<string, { at: number; detail: string }>()
  for (const job of jobs) {
    const blockLine = job.output?.error?.split("\n").find((line) => line.includes(GUARDRAIL_ERROR_MARKER))
    if (!blockLine) continue
    const at = (job.ended_at ?? job.started_at ?? new Date(0)).getTime()
    const previous = latestBlockByJob.get(job.name)
    if (!previous || previous.at < at) {
      latestBlockByJob.set(job.name, { at, detail: blockLine.slice(blockLine.indexOf(GUARDRAIL_ERROR_MARKER) + GUARDRAIL_ERROR_MARKER.length).trim() })
    }
  }
  return [...latestBlockByJob].map(([jobName, { at, detail }]) => ({ jobName, detail, at }))
}

/** Alerte immédiate (Slack + logs) ; Sentry reçoit l'erreur levée ensuite, via job-processor. */
export const alertGuardrailBlock = async (subject: string, message: string) => {
  logger.error({ subject }, `${GUARDRAIL_ERROR_MARKER} ${message}`)
  try {
    await notifyToSlack({ subject, message: `${GUARDRAIL_ERROR_MARKER} ${message}`, error: true })
  } catch (err) {
    logger.error(err, "échec de l'alerte Slack du garde-fou offres partenaires")
    sentryCaptureException(err)
  }
}
