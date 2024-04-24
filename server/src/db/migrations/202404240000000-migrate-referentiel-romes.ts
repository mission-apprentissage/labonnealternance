import { Db } from "mongodb"

import { logger } from "@/common/logger"

export const up = async (db: Db) => {
  await db.collection("recruiters").updateMany(
    {},
    {
      $unset: { "jobs.$[].rome_detail": 1 },
    },
    {
      // @ts-expect-error bypassDocumentValidation is not properly set in @types/mongodb
      bypassDocumentValidation: true,
    }
  )

  // suppression collection fichemetierromev3
  //await db.fichemetierromev3.drop()

  logger.info("20240424000000-rome_details_from_rome_v4")
}
