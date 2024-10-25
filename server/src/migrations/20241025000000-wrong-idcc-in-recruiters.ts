import { Db } from "mongodb"

import { logger } from "@/common/logger"

export const up = async (db: Db) => {
  logger.info("20241025000000-wrong-idcc-in-recruiters started")

  await db.collection("recruiters").updateMany(
    {
      $or: [{ idcc: { $regex: "^a0I0Y" } }, { idcc: { $regex: "^Opco multiple" } }],
    },
    {
      $set: {
        idcc: null,
      },
    },
    {
      bypassDocumentValidation: true,
    }
  )

  logger.info("20241025000000-wrong-idcc-in-recruiters ended")
}
