import { Db } from "mongodb"

import { logger } from "@/common/logger"

export const up = async (db: Db) => {
  await db.collection("users").updateMany(
    {},
    {
      $unset: { is_anonymized: "" },
    },
    {
      bypassDocumentValidation: true,
    }
  )

  await db.collection("anonymized_users").updateMany(
    {},
    {
      $unset: { userId: "" },
    },
    {
      bypassDocumentValidation: true,
    }
  )

  logger.info("20240227000000-remove_is_anonymized_from_users")
}
