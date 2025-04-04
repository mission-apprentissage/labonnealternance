import { Db } from "mongodb"
import { ApplicationScanStatus } from "shared/models/index"

import { logger } from "@/common/logger"

export const up = async (db: Db) => {
  logger.info("202407230000000-async-clamav started")

  await db.collection("applications").updateMany(
    {},
    {
      $set: {
        scan_status: ApplicationScanStatus.NO_VIRUS_DETECTED,
      },
    }
  )

  logger.info("202407230000000-async-clamav ended")
}
