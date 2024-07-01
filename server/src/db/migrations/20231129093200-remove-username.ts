import { Db } from "mongodb"

import { logger } from "@/common/logger"

export const up = async (db: Db) => {
  await db.collection("users").dropIndex("username_1")
  await db.collection("users").updateMany(
    {},
    {
      $unset: { username: "" },
    },
    {
      bypassDocumentValidation: true,
    }
  )

  logger.info("20231127120528-remove-username")
}
