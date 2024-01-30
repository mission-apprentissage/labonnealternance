import { logger } from "@/common/logger"
import { notifyToSlack } from "@/common/utils/slackUtils"

export const runGarbageCollector = async function () {
  try {
    logger.info("Lancement du garbage collector")
    if (typeof global !== "undefined" && global && "gc" in global) {
      global.gc?.()
    } else {
      logger.warn("global.gc not available")
    }
    logger.info("Fin du garbage collector")
  } catch (err: any) {
    await notifyToSlack({ subject: "Garbage collector", message: "échec du passage du garbage collector", error: true })
    throw err
  }
}
