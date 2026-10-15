import { logger } from "@/common/logger"

import type { SuggestionsNafWindow } from "./find-suggestions-naf-applicants"
import { findSuggestionsNafApplicants, getLast24hWindow, getPreviousDayWindow } from "./find-suggestions-naf-applicants"
import { findSuggestionsNafTargets } from "./find-suggestions-naf-targets"

const processSuggestionsNafForWindow = async (window: SuggestionsNafWindow) => {
  const applicants = await findSuggestionsNafTargets(await findSuggestionsNafApplicants(window))
  const targets = applicants.flatMap(({ _id, targets }) => targets.map(({ rome, sectors }) => ({ applicant_id: _id.toString(), rome, nafs: sectors.map(({ naf }) => naf) })))
  logger.info({ from: window.from, to: window.to, applicants: applicants.length, targets: targets.length, details: targets }, "processSuggestionsNaf: ROME et secteurs à suggérer")
  return { applicants: applicants.length, targets: targets.length }
}

export const processSuggestionsNaf = async () => processSuggestionsNafForWindow(getPreviousDayWindow())

export const processSuggestionsNafLast24h = async () => processSuggestionsNafForWindow(getLast24hWindow())
