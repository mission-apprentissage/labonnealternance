import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  logger.info("Removing opco_short_name field from opcos collection")
  await getDbCollection("opcos").updateMany({ opco_short_name: { $exists: true } }, { $unset: { opco_short_name: "" } }, { bypassDocumentValidation: true })
  logger.info("opco_short_name field removed from opcos collection")
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
