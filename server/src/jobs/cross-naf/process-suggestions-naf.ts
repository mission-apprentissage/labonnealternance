import { logger } from "@/common/logger"
import { notifyToSlack } from "@/common/utils/slack-utils"

import type { SuggestionsNafWindow } from "./find-suggestions-naf-applicants"
import { findSuggestionsNafApplicants, getLast24hWindow, getPreviousDayWindow } from "./find-suggestions-naf-applicants"
import { findSuggestionsNafJobs, MIN_SUGGESTIONS } from "./find-suggestions-naf-jobs"
import { findSuggestionsNafTargets } from "./find-suggestions-naf-targets"
import { sendSuggestionsNafEmails } from "./send-suggestions-naf-emails"

const processSuggestionsNafForWindow = async (window: SuggestionsNafWindow, { dryRun = false } = {}) => {
  const applicants = await findSuggestionsNafJobs(await findSuggestionsNafTargets(await findSuggestionsNafApplicants(window)))
  const targets = applicants.flatMap(({ _id, targets }) =>
    targets.map(({ rome, suggestions }) => ({
      applicant_id: _id.toString(),
      rome,
      sendable: suggestions.length >= MIN_SUGGESTIONS,
      suggestions: suggestions.map(({ sector, job }) => `${sector.naf} ${job.partner_label} ${job.distance_km.toFixed(1)} km`),
    }))
  )
  const stats = { applicants: applicants.length, targets: targets.length, sendable: targets.filter(({ sendable }) => sendable).length }
  logger.info({ from: window.from, to: window.to, dryRun, ...stats, details: targets }, "processSuggestionsNaf: offres à suggérer par ROME")
  if (dryRun) return stats

  const counters = await sendSuggestionsNafEmails(applicants)
  await notifyToSlack({
    subject: "SUGGESTIONS NAF",
    message: `${counters.sent} email(s) envoyé(s) à ${stats.applicants} nouveau(x) candidat(s), ${counters.failed} échec(s), ${counters.blacklisted} candidat(s) en liste noire`,
    error: counters.failed > 0,
  })
  return { ...stats, ...counters }
}

export const processSuggestionsNaf = async () => processSuggestionsNafForWindow(getPreviousDayWindow())

export const processSuggestionsNafLast24h = async ({ dryRun = false }: { dryRun?: boolean } = {}) => processSuggestionsNafForWindow(getLast24hWindow(), { dryRun })
