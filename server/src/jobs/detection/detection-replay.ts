import type { IDetectionAlert, IDetectionMetrics } from "shared/models/detection-alerts.model"
import { DETECTION_ALERT_STATUS } from "shared/models/detection-alerts.model"

import { assertValidFindings, getSlotStart, nextAlertState, reconcileFindings } from "./detection-engine"
import type { IDetectionNotificationType } from "./detection-notification"
import type { IDetectionRule } from "./detection-rule"

const MINUTE_MS = 60 * 1000

const NOTIFIED_TRANSITIONS: string[] = ["entree", "rappel", "sortie"] satisfies IDetectionNotificationType[]

export type IReplayLine = {
  slot: string
  en_alerte: boolean
  notifications: string[]
  observations: IDetectionMetrics | null
}

/**
 * Rejoue une règle créneau par créneau sur [from, to[, avec la déduplication du cron, sans rien écrire ni notifier.
 * Valable pour une règle qui lit des données datées : ses constats à un créneau passé sont ceux du cron ce jour-là.
 */
export const replayDetectionRule = async <TThresholds>({ rule, from, to, thresholds }: { rule: IDetectionRule<TThresholds>; from: Date; to: Date; thresholds: TThresholds }) => {
  const period = rule.periodicity.everyMinutes * MINUTE_MS
  const firstSlot = getSlotStart(rule.periodicity, from)
  let activeAlerts: IDetectionAlert[] = []
  const openedEpisodes = new Map<string, IDetectionAlert>()
  const lines: IReplayLine[] = []
  for (let slot = firstSlot < from ? new Date(firstSlot.getTime() + period) : firstSlot; slot < to; slot = new Date(slot.getTime() + period)) {
    const { findings, observations } = await rule.evaluate({ now: slot, thresholds, activeAlerts })
    assertValidFindings(rule, findings)
    const transitions = reconcileFindings({ findings, activeAlerts, confirmations: rule.confirmations, reminderEveryHours: rule.reminderEveryHours, now: slot })
    activeAlerts = []
    for (const transition of transitions) {
      const next = nextAlertState(rule, transition, slot)
      if (next?.opened_at) openedEpisodes.set(next._id.toString(), next)
      if (next && next.status !== DETECTION_ALERT_STATUS.FERMEE) activeAlerts.push(next)
    }
    lines.push({
      slot: slot.toISOString(),
      en_alerte: activeAlerts.some(({ status }) => status === DETECTION_ALERT_STATUS.OUVERTE),
      notifications: transitions.map(({ type }) => type).filter((type) => NOTIFIED_TRANSITIONS.includes(type)),
      observations: observations ?? null,
    })
  }
  const episodes = [...openedEpisodes.values()].map(({ key, opened_at, closed_at, notification_count }) => ({ key, opened_at, closed_at, notifications: notification_count }))
  return { lines, episodes }
}
