import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  logger.info("Removing establishment_id field from jobs_partners collection")
  await getDbCollection("jobs_partners").updateMany({ establishment_id: { $exists: true } }, { $unset: { establishment_id: "" } })
  logger.info("establishment_id field removed from jobs_partners collection")
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
