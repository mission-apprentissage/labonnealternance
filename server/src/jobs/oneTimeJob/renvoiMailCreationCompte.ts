import { UserEventType } from "shared"

import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { sendUserConfirmationEmail } from "@/services/etablissement.service"

export const renvoiMailCreationCompte = async () => {
  logger.info("Début de renvoiMailCreationCompte")
  const fromDate = new Date("2025-04-23T10:00:00.00Z")
  const toDate = new Date("2025-04-28T23:00:00.00Z")

  const users = await getDbCollection("userswithaccounts")
    .find({ createdAt: { $gt: fromDate, $lt: toDate }, status: { $size: 1 } })
    .toArray()

  const stats = { success: 0, error: 0 }
  await asyncForEach(users, async (user) => {
    try {
      if (!user.status.some((event) => event.status === UserEventType.VALIDATION_EMAIL)) {
        await sendUserConfirmationEmail(user)
        stats.success++
      }
    } catch (err) {
      logger.error(err)
      sentryCaptureException(err)
      stats.error++
    }
  })

  logger.info(`Renvoi des emails de validation de compte. Db : ${users.length}. Succès : ${stats.success}, échecs: ${stats.error}`)
  logger.info("Fin de renvoiMailCreationCompte")
}
