import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  logger.info("Starting migration: add lba_url computed field to computed_jobs_partners")

  await getDbCollection("computed_jobs_partners").updateMany({}, { $set: { lba_url: null } })

  logger.info("Migration completed: add lba_url computed field to computed_jobs_partners")
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
