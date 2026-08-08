import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"

/**
 * Reset the invitation and refusal dates for all establishments
 * Executed once a year before seasonality starts, usually begin of January.
 */
export const resetInvitationDates = async () => {
  logger.info("resetInvitationDates job started")
  await getDbCollection("etablissements").updateMany(
    {},
    { $set: { premium_invitation_date: null, premium_affelnet_invitation_date: null, premium_refusal_date: null, premium_affelnet_refusal_date: null } }
  )
  await notifyToSlack({ subject: "RDVA - DATE PREMIUM - RESET", message: "Réinitialisation des dates d'invitation au premium parcoursup & affelnet" })
  logger.info("resetInvitationDates job ended")
}
