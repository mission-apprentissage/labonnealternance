import { SCHEDULED_REPLY_CRON_INTERVAL_MINUTES, SCHEDULED_REPLY_DELAY_MINUTES } from "../constants/application.js"

const CRON_INTERVAL_MS = SCHEDULED_REPLY_CRON_INTERVAL_MINUTES * 60 * 1000

/**
 * Heure d'envoi d'une réponse programmée : premier passage du cron une fois le délai écoulé (cf.
 * processScheduledRecruiterIntentions). Approximative : le traitement du lot peut prendre quelques minutes.
 */
export const getScheduledReplySendDate = (scheduledAt: Date | string): Date => {
  const dueAt = new Date(scheduledAt).getTime() + SCHEDULED_REPLY_DELAY_MINUTES * 60 * 1000
  return new Date(Math.ceil(dueAt / CRON_INTERVAL_MS) * CRON_INTERVAL_MS)
}
