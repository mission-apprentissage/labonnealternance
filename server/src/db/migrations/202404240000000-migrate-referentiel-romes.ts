import { Db } from "mongodb"

import { logger } from "@/common/logger"

export const up = async (db: Db) => {
  await db.collection("recruiters").updateMany(
    {},
    {
      $unset: { "jobs.$[].rome_detail": 1 },
    },
    {
      bypassDocumentValidation: true,
    }
  )

  await db.collection("fichemetierromev3").drop()

  logger.info("20240424000000-rome_details_from_rome_v4")
}
