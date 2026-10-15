import { logger } from "@/common/logger"

import type { SuggestionsNafWindow } from "./find-suggestions-naf-applicants"
import { findSuggestionsNafApplicants, getLast24hWindow, getPreviousDayWindow } from "./find-suggestions-naf-applicants"
import { findSuggestionsNafJobs, MIN_SUGGESTIONS } from "./find-suggestions-naf-jobs"
import { findSuggestionsNafTargets } from "./find-suggestions-naf-targets"

const processSuggestionsNafForWindow = async (window: SuggestionsNafWindow) => {
  const applicants = await findSuggestionsNafJobs(await findSuggestionsNafTargets(await findSuggestionsNafApplicants(window)))
  const targets = applicants.flatMap(({ _id, targets }) =>
    targets.map(({ rome, suggestions }) => ({
      applicant_id: _id.toString(),
      rome,
      sendable: suggestions.length >= MIN_SUGGESTIONS,
      suggestions: suggestions.map(({ sector, job }) => `${sector.naf} ${job.partner_label} ${job.distance_km.toFixed(1)} km`),
    }))
  )
  const sendable = targets.filter(({ sendable }) => sendable).length
  logger.info(
    { from: window.from, to: window.to, applicants: applicants.length, targets: targets.length, sendable, details: targets },
    "processSuggestionsNaf: offres à suggérer par ROME"
  )
  return { applicants: applicants.length, targets: targets.length, sendable }
}

export const processSuggestionsNaf = async () => processSuggestionsNafForWindow(getPreviousDayWindow())

export const processSuggestionsNafLast24h = async () => processSuggestionsNafForWindow(getLast24hWindow())
