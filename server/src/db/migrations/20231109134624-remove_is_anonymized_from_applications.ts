import { Db } from "mongodb"

import { logger } from "@/common/logger"

export const up = async (db: Db) => {
  await db.collection("applications").updateMany(
    {},
    {
      $unset: { is_anonymized: "" },
    },
    {
      bypassDocumentValidation: true,
    }
  )

  logger.info("20231109134624-remove_is_anonymized_from_applications")
}
