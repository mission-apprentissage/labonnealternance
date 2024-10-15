import { Db } from "mongodb"

import { logger } from "@/common/logger"

export const up = async (db: Db) => {
  logger.info("20241015000000-setting-traffic-source-date")

  const today = new Date()
  await db.collection("trafficsources").updateMany(
    {},
    {
      $set: {
        created_at: today,
      },
    },
    {
      bypassDocumentValidation: true,
    }
  )

  logger.info("20241015000000-setting-traffic-source-date")
}
