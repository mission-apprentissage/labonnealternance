import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"

export const anonymizeReportedReasons = async function () {
  try {
    logger.info("[START] Anonymisation des raisons pour les signalements d'offre de plus d'un (1) an")

    const period = new Date()
    period.setFullYear(period.getFullYear() - 1)
    const anonymizedReportingReasonsCount = await getDbCollection("reported_companies").updateMany({ createdAt: { $lte: period } }, { $set: { reasonDetails: null } })

    await notifyToSlack({
      subject: "ANONYMISATION RAISONS",
      message: `Anonymisation des raisons pour les signalements d'offre de plus d'un (1) an terminée. ${anonymizedReportingReasonsCount} raison(s) anonymisée(s).`,
    })
  } catch (err: any) {
    await notifyToSlack({ subject: "ANONYMISATION RAISONS", message: `ECHEC anonymisation des raisons`, error: true })
    throw err
  }
  logger.info("[END] Anonymisation des raisons pour les signalements d'offre de plus d'un (1) an")
}
