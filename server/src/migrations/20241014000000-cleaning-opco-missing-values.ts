import { Db } from "mongodb"
import { OPCOS_LABEL } from "shared/constants"

import { logger } from "@/common/logger"

export const up = async (db: Db) => {
  logger.info("20241014000000-cleaning-opco-missing-values started")

  await db.collection("entreprise").updateMany(
    {
      opco: { $exists: false },
    },
    {
      $set: {
        opco: OPCOS_LABEL.UNKNOWN_OPCO,
      },
    },
    {
      bypassDocumentValidation: true,
    }
  )
  await db.collection("recruiters").updateMany(
    {
      opco: { $exists: false },
    },
    {
      $set: {
        opco: OPCOS_LABEL.UNKNOWN_OPCO,
      },
    },
    {
      bypassDocumentValidation: true,
    }
  )

  await db.collection("entreprise").updateMany(
    { opco: null },
    {
      $set: {
        opco: OPCOS_LABEL.UNKNOWN_OPCO,
      },
    },
    {
      bypassDocumentValidation: true,
    }
  )
  await db.collection("recruiters").updateMany(
    { opco: null },
    {
      $set: {
        opco: OPCOS_LABEL.UNKNOWN_OPCO,
      },
    },
    {
      bypassDocumentValidation: true,
    }
  )

  logger.info("20241014000000-cleaning-opco-missing-values ended")
}
