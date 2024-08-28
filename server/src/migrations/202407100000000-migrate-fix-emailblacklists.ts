import { Db } from "mongodb"

import { logger } from "@/common/logger"

export const up = async (db: Db) => {
  logger.info("202407100000000-migrate-fix-emailblacklists started")

  await db.collection("emailblacklists").aggregate([
    {
      $replaceWith: {
        $unsetField: {
          field: { $literal: "$$setOnInsert" },
          input: "$$ROOT",
        },
      },
    },
  ])

  const created_at = new Date()
  await db.collection("emailblacklists").updateMany(
    {
      created_at: { $exists: false },
    },
    {
      $set: { created_at },
    }
  )

  logger.info("202407100000000-migrate-fix-emailblacklists ended")
}
