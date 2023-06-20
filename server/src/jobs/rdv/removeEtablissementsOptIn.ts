import { logger } from "../../common/logger.js"
import { optMode } from "../../common/model/constants/etablissement.js"

/**
 * @description Active all etablissement's formations that have subscribed to opt-out.
 * @returns {Promise<void>}
 */
export const removeEtablissementsOptIn = async ({ etablissements }) => {
  logger.info("Cron #removeOptInEtablissements started.")

  const etablissementsToRemove = await etablissements.find({
    opt_mode: optMode.OPT_IN,
  })

  logger.info(`Etablissements to migrate: ${etablissementsToRemove.length}`)

  for (etablissements of etablissementsToRemove) {
    await etablissements.update(
      {
        opt_mode: null,
        opt_in_activated_at: null,
      },
      { $unset: { opt_in_activated_at: 1 } }
    )
  }
  logger.info("Cron #removeOptInEtablissements done.")
}
