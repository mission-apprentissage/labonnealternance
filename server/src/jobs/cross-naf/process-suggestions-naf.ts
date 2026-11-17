import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"
import config from "@/config"

import type { SuggestionsNafWindow } from "./find-suggestions-naf-applicants"
import { findSuggestionsNafApplicants, getLast24hWindow, getPreviousDayWindow } from "./find-suggestions-naf-applicants"
import { findSuggestionsNafJobs, MIN_SUGGESTIONS } from "./find-suggestions-naf-jobs"
import { findSuggestionsNafTargets } from "./find-suggestions-naf-targets"
import { sendSuggestionsNafEmails } from "./send-suggestions-naf-emails"

// Référentiel vide (import pas encore passé ou purgé) : sans échec explicite, le run annoncerait 0 email sans erreur
// et les candidats de la fenêtre seraient perdus. En échec, un rejeu le jour même après l'import les reprend.
const processSuggestionsNafForWindow = async (window: SuggestionsNafWindow) => {
  if (!(await getDbCollection("referentiel_rome_naf").findOne({}, { projection: { _id: 1 } }))) {
    throw new Error("processSuggestionsNaf: référentiel ROME × NAF vide, lancer importReferentielRomeNaf puis rejouer le job")
  }
  const applicants = await findSuggestionsNafJobs(await findSuggestionsNafTargets(await findSuggestionsNafApplicants(window)))
  const targets = applicants.flatMap(({ targets }) => targets)
  const stats = { applicants: applicants.length, targets: targets.length, sendable: targets.filter(({ suggestions }) => suggestions.length >= MIN_SUGGESTIONS).length }
  logger.info({ from: window.from, to: window.to, ...stats }, "processSuggestionsNaf: synthèse des suggestions")

  const counters = await sendSuggestionsNafEmails(applicants)
  await notifyToSlack({
    subject: "SUGGESTIONS NAF",
    message: `${counters.sent} email(s) envoyé(s) à ${stats.applicants} nouveau(x) candidat(s), ${counters.failed} échec(s), ${counters.blacklisted} candidat(s) en liste noire`,
    error: counters.failed > 0,
  })
  return { ...stats, ...counters }
}

export const processSuggestionsNaf = async () => processSuggestionsNafForWindow(getPreviousDayWindow())

// Test en recette : en production, l'email part le lendemain de la candidature (RG 3), via le cron ou un rejeu de processSuggestionsNaf.
// Gardé ici et pas seulement côté UI : la route d'admin et la CLI l'appellent aussi.
export const processSuggestionsNafLast24h = async () => {
  if (config.env === "production") {
    throw new Error("processSuggestionsNafLast24h: test manuel réservé hors production, utiliser processSuggestionsNaf")
  }
  return processSuggestionsNafForWindow(getLast24hWindow())
}
