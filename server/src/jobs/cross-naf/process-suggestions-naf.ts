import { logger } from "@/common/logger"

import type { SuggestionsNafWindow } from "./find-suggestions-naf-applicants"
import { findSuggestionsNafApplicants, getLast24hWindow, getPreviousDayWindow } from "./find-suggestions-naf-applicants"

const processSuggestionsNafForWindow = async (window: SuggestionsNafWindow) => {
  const applicants = await findSuggestionsNafApplicants(window)
  logger.info(
    { from: window.from, to: window.to, applicants: applicants.length, applicantIds: applicants.map(({ _id }) => _id.toString()) },
    "processSuggestionsNaf: candidats éligibles aux suggestions NAF"
  )
  return { applicants: applicants.length }
}

export const processSuggestionsNaf = async () => processSuggestionsNafForWindow(getPreviousDayWindow())

export const processSuggestionsNafLast24h = async () => processSuggestionsNafForWindow(getLast24hWindow())
