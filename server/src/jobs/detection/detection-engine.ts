import { ObjectId } from "mongodb"
import type { IDetectionAlert, IDetectionMetrics } from "shared/models/detection-alerts.model"
import { DETECTION_ALERT_ACTIVE_STATUSES, DETECTION_ALERT_STATUS } from "shared/models/detection-alerts.model"
import type { IDetectionRuleState } from "shared/models/detection-rules.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import type { IDetectionNotificationTarget } from "./detection-notification"
import { assertNoEmailInFinding, notifyDetection } from "./detection-notification"
import type { IDetectionFinding, IDetectionRule } from "./detection-rule"
import { detectionRules } from "./detection-rules"

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS

/** Cadence du cron d'évaluation : la périodicité de chaque règle en est un multiple (cf. assertValidRules). */
export const DETECTION_TICK_MINUTES = 15

/** Les échecs d'évaluation d'une règle forment leur propre épisode, à part de ses constats. */
export const EVALUATION_FAILURE_KEY = "echec_evaluation"
const FAILURE_REMINDER_HOURS = 24

export const getSlotStart = ({ everyMinutes, offsetMinutes = 0 }: IDetectionRule["periodicity"], at: Date): Date => {
  const period = everyMinutes * MINUTE_MS
  const offset = offsetMinutes * MINUTE_MS
  return new Date(Math.floor((at.getTime() - offset) / period) * period + offset)
}

/** Un créneau hors de la cadence du cron serait évalué en retard ; des seuils par défaut invalides feraient échouer la règle. */
export const assertValidRules = (rules: IDetectionRule[]) => {
  const ids = rules.map(({ id }) => id)
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)
  if (duplicates.length) {
    throw new Error(`règles de détection en double : ${duplicates.join(", ")}`)
  }
  for (const rule of rules) {
    const { everyMinutes, offsetMinutes = 0 } = rule.periodicity
    if (everyMinutes <= 0 || everyMinutes % DETECTION_TICK_MINUTES !== 0 || offsetMinutes % DETECTION_TICK_MINUTES !== 0) {
      throw new Error(`règle ${rule.id} : périodicité et décalage doivent être des multiples de ${DETECTION_TICK_MINUTES} min`)
    }
    if (!Number.isInteger(rule.confirmations) || rule.confirmations < 1 || rule.reminderEveryHours <= 0) {
      throw new Error(`règle ${rule.id} : confirmations (entier ≥ 1) et intervalle de rappel (> 0) attendus`)
    }
    rule.thresholds.parse({})
  }
}

export const resolveRuleSettings = <TThresholds>(rule: IDetectionRule<TThresholds>, state: Pick<IDetectionRuleState, "enabled" | "thresholds"> | null) => ({
  enabled: state?.enabled ?? rule.enabledByDefault,
  thresholds: rule.thresholds.parse(state?.thresholds ?? {}),
})

export type IDetectionTransition =
  | { type: "en_attente" | "entree"; finding: IDetectionFinding; hits: number; alert: IDetectionAlert | null }
  | { type: "maintien" | "rappel"; finding: IDetectionFinding; hits: number; alert: IDetectionAlert }
  | { type: "sortie" | "abandon"; alert: IDetectionAlert }

/**
 * Déduplication : notifie à l'entrée en alerte (après `confirmations` constats consécutifs), en rappel tous les
 * `reminderEveryHours`, et à la sortie. Un constat non confirmé qui disparaît est abandonné sans notification.
 */
export const reconcileFindings = ({
  findings,
  activeAlerts,
  confirmations,
  reminderEveryHours,
  now,
}: {
  findings: IDetectionFinding[]
  activeAlerts: IDetectionAlert[]
  confirmations: number
  reminderEveryHours: number
  now: Date
}): IDetectionTransition[] => {
  const alertsByKey = new Map(activeAlerts.map((alert) => [alert.key, alert]))
  const transitions: IDetectionTransition[] = []
  for (const finding of findings) {
    const alert = alertsByKey.get(finding.key) ?? null
    alertsByKey.delete(finding.key)
    // Un créneau déjà compté (évaluation reprise après un échec) ne compte pas une seconde fois.
    const hits = alert ? alert.hits + (alert.last_seen_at.getTime() === now.getTime() ? 0 : 1) : 1
    if (alert?.status === DETECTION_ALERT_STATUS.OUVERTE) {
      const lastNotifiedAt = alert.last_notified_at ?? alert.opened_at ?? now
      const reminderDue = now.getTime() - lastNotifiedAt.getTime() >= reminderEveryHours * HOUR_MS
      transitions.push({ type: reminderDue ? "rappel" : "maintien", finding, hits, alert })
    } else {
      transitions.push({ type: hits >= confirmations ? "entree" : "en_attente", finding, hits, alert })
    }
  }
  for (const alert of alertsByKey.values()) {
    transitions.push({ type: alert.status === DETECTION_ALERT_STATUS.OUVERTE ? "sortie" : "abandon", alert })
  }
  return transitions
}

const assertValidFindings = (rule: IDetectionRule, findings: IDetectionFinding[]) => {
  const keys = findings.map(({ key }) => key)
  if (new Set(keys).size !== keys.length) {
    throw new Error(`règle ${rule.id} : plusieurs constats pour une même clé`)
  }
  if (keys.includes(EVALUATION_FAILURE_KEY)) {
    throw new Error(`règle ${rule.id} : clé réservée ${EVALUATION_FAILURE_KEY}`)
  }
  findings.forEach((finding) => assertNoEmailInFinding(rule.id, finding))
}

/** État de l'épisode après la transition, `null` s'il est abandonné. */
export const nextAlertState = (target: IDetectionNotificationTarget, transition: IDetectionTransition, now: Date): IDetectionAlert | null => {
  switch (transition.type) {
    case "en_attente":
    case "entree":
    case "maintien":
    case "rappel": {
      const { finding, hits, alert } = transition
      const seen: IDetectionAlert = {
        ...(alert ?? {
          _id: new ObjectId(),
          rule_id: target.id,
          key: finding.key,
          severity: target.severity,
          status: DETECTION_ALERT_STATUS.EN_ATTENTE,
          first_seen_at: now,
          opened_at: null,
          last_notified_at: null,
          notification_count: 0,
          closed_at: null,
          opening_metrics: null,
          qualification: null,
        }),
        hits,
        last_seen_at: now,
        last_metrics: finding.metrics,
        summary: finding.summary,
      }
      if (transition.type === "entree") {
        return { ...seen, status: DETECTION_ALERT_STATUS.OUVERTE, opened_at: now, last_notified_at: now, notification_count: 1, opening_metrics: finding.metrics }
      }
      if (transition.type === "rappel") {
        return { ...seen, last_notified_at: now, notification_count: seen.notification_count + 1 }
      }
      return seen
    }
    case "sortie":
      return {
        ...transition.alert,
        status: DETECTION_ALERT_STATUS.FERMEE,
        closed_at: now,
        last_notified_at: now,
        notification_count: transition.alert.notification_count + 1,
      }
    case "abandon":
      return null
  }
}

/** La notification part avant l'écriture : un envoi en échec laisse l'état intact et sera retenté. */
const applyTransition = async (target: IDetectionNotificationTarget, transition: IDetectionTransition, now: Date) => {
  const next = nextAlertState(target, transition, now)
  const alerts = getDbCollection("detection_alerts")
  if (!next) {
    await alerts.deleteOne({ _id: transition.alert?._id })
    return
  }
  if (transition.type === "entree" || transition.type === "rappel" || transition.type === "sortie") {
    await notifyDetection(target, transition.type, next, "finding" in transition ? transition.finding.links : undefined, now)
  }
  if (transition.alert) {
    const { _id, ...fields } = next
    await alerts.updateOne({ _id }, { $set: fields })
  } else {
    await alerts.insertOne(next)
  }
}

const failureTarget = (rule: IDetectionRule): IDetectionNotificationTarget => ({ id: rule.id, title: `Évaluation de « ${rule.title} »`, severity: "technique" })

// Le nom de l'erreur seulement : son message peut citer des valeurs de documents, ou l'URL d'un webhook.
const failureFinding = (errorName: string): IDetectionFinding => ({
  key: EVALUATION_FAILURE_KEY,
  metrics: { erreur: errorName },
  summary: `Évaluation impossible (${errorName}) : les alertes de la règle sont figées, détail dans Sentry.`,
})

const errorName = (error: unknown) => (error instanceof Error ? error.name : "Error")

const summarizeTransition = (transition: IDetectionTransition) => ({
  type: transition.type,
  key: "finding" in transition ? transition.finding.key : transition.alert.key,
  metrics: "finding" in transition ? transition.finding.metrics : transition.alert.last_metrics,
})

type IRuleReport = {
  rule: string
  status: "desactivee" | "deja_evaluee" | "evaluee" | "echec"
  slot?: Date
  observations?: IDetectionMetrics
  transitions?: ReturnType<typeof summarizeTransition>[]
}

const loadRuleState = async (ruleId: string, dryRun: boolean): Promise<IDetectionRuleState | null> =>
  dryRun
    ? getDbCollection("detection_rules").findOne({ rule_id: ruleId })
    : getDbCollection("detection_rules").findOneAndUpdate(
        { rule_id: ruleId },
        { $setOnInsert: { enabled: null, thresholds: null, updated_at: null, last_slot_at: null } },
        { upsert: true, returnDocument: "after" }
      )

/**
 * Réserve le créneau pour cette exécution : un cron sans `concurrency: exclusive` (cf. jobs.ts) peut lancer deux
 * évaluations en parallèle, une seule notifie. Renvoie `undefined` si le créneau est déjà pris.
 */
const claimSlot = async (ruleId: string, slot: Date): Promise<{ previousSlot: Date | null } | undefined> => {
  const before = await getDbCollection("detection_rules").findOneAndUpdate(
    { rule_id: ruleId, $or: [{ last_slot_at: null }, { last_slot_at: { $lt: slot } }] },
    { $set: { last_slot_at: slot } },
    { returnDocument: "before" }
  )
  return before ? { previousSlot: before.last_slot_at } : undefined
}

const runRule = async (rule: IDetectionRule, at: Date, dryRun: boolean): Promise<IRuleReport> => {
  const state = await loadRuleState(rule.id, dryRun)
  if (!(state?.enabled ?? rule.enabledByDefault)) {
    return { rule: rule.id, status: "desactivee" }
  }
  const slot = getSlotStart(rule.periodicity, at)
  const claim = dryRun ? { previousSlot: null } : await claimSlot(rule.id, slot)
  if (!claim) {
    return { rule: rule.id, status: "deja_evaluee", slot }
  }

  const activeAlerts = await getDbCollection("detection_alerts")
    .find({ rule_id: rule.id, status: { $in: [...DETECTION_ALERT_ACTIVE_STATUSES] } })
    .toArray()
  const failureAlerts = activeAlerts.filter(({ key }) => key === EVALUATION_FAILURE_KEY)
  const findingAlerts = activeAlerts.filter(({ key }) => key !== EVALUATION_FAILURE_KEY)

  try {
    const { thresholds } = resolveRuleSettings(rule, state)
    const { findings, observations } = await rule.evaluate({ now: slot, thresholds, activeAlerts: findingAlerts })
    assertValidFindings(rule, findings)
    const transitions = reconcileFindings({ findings, activeAlerts: findingAlerts, confirmations: rule.confirmations, reminderEveryHours: rule.reminderEveryHours, now: slot })
    const recovery = reconcileFindings({ findings: [], activeAlerts: failureAlerts, confirmations: 1, reminderEveryHours: FAILURE_REMINDER_HOURS, now: slot })
    if (!dryRun) {
      for (const transition of transitions) {
        await applyTransition(rule, transition, slot)
      }
      for (const transition of recovery) {
        await applyTransition(failureTarget(rule), transition, slot)
      }
    }
    return { rule: rule.id, status: "evaluee", slot, observations, transitions: [...transitions, ...recovery].map(summarizeTransition) }
  } catch (error) {
    sentryCaptureException(error, { tags: { detection_rule: rule.id } })
    logger.error({ rule: rule.id, error: errorName(error) }, "règle de détection en échec")
    if (!dryRun) {
      // Libère le créneau : la prochaine exécution du cron réessaie, sans attendre le créneau suivant de la règle.
      await getDbCollection("detection_rules").updateOne({ rule_id: rule.id, last_slot_at: slot }, { $set: { last_slot_at: claim.previousSlot } })
      try {
        const failure = reconcileFindings({
          findings: [failureFinding(errorName(error))],
          activeAlerts: failureAlerts,
          confirmations: 1,
          reminderEveryHours: FAILURE_REMINDER_HOURS,
          now: slot,
        })
        for (const transition of failure) {
          await applyTransition(failureTarget(rule), transition, slot)
        }
      } catch (notificationError) {
        sentryCaptureException(notificationError, { tags: { detection_rule: rule.id } })
        logger.error({ rule: rule.id, error: errorName(notificationError) }, "échec de la notification d'une règle de détection en échec")
      }
    }
    return { rule: rule.id, status: "echec", slot }
  }
}

/**
 * Évalue les règles de détection actives dont le créneau est échu (#5421). Une règle en échec n'empêche pas les
 * autres de passer, mais le job finit en erreur.
 */
export const runDetectionRules = async ({
  rule: ruleId,
  dryRun = false,
  now = new Date(),
  rules = detectionRules,
}: {
  rule?: string
  dryRun?: boolean
  now?: Date
  rules?: IDetectionRule[]
} = {}) => {
  assertValidRules(rules)
  const selected = ruleId ? rules.filter(({ id }) => id === ruleId) : rules
  if (ruleId && !selected.length) {
    throw new Error(`règle de détection inconnue : ${ruleId}`)
  }
  const reports: IRuleReport[] = []
  for (const rule of selected) {
    const report = await runRule(rule, now, dryRun)
    logger.info({ ...report, dryRun }, "règle de détection")
    reports.push(report)
  }
  const failed = reports.filter(({ status }) => status === "echec").map(({ rule }) => rule)
  if (failed.length) {
    throw new Error(`règles de détection en échec : ${failed.join(", ")}`)
  }
  return reports
}
