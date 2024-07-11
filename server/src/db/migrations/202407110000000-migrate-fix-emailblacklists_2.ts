import { Db } from "mongodb"

import { logger } from "@/common/logger"

export const up = async (db: Db) => {
  logger.info("202407110000000-migrate-fix-emailblacklists_2 started")

  await db.collection("emailblacklists").aggregate([
    {
      $replaceWith: {
        $unsetField: {
          field: { $literal: "$setOnInsert" },
          input: "$$ROOT",
        },
      },
    },
    {
      $merge: {
        into: "emailblacklists",
        on: "_id",
        whenMatched: "replace",
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

  logger.info("202407110000000-migrate-fix-emailblacklists_2 ended")
}
