import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"

export const up = async () => {
  logger.info("Removing engagementHandicapEmail field from rolemanagements collection")
  await getDbCollection("rolemanagements").updateMany(
    { engagementHandicapEmail: { $exists: true } },
    { $unset: { engagementHandicapEmail: "" } },
    { bypassDocumentValidation: true }
  )
  logger.info("engagementHandicapEmail field removed from rolemanagements collection")
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
