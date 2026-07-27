import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  logger.info("Removing origin field from rolemanagements collection")
  await getDbCollection("rolemanagements").updateMany({ origin: { $exists: true } }, { $unset: { origin: "" } }, { bypassDocumentValidation: true })
  logger.info("origin field removed from rolemanagements collection")
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
