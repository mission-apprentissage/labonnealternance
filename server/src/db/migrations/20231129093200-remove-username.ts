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
      // @ts-expect-error bypassDocumentValidation is not properly set in @types/mongodb
      bypassDocumentValidation: true,
    }
  )

  logger.info("20231127120528-remove-username")
}
