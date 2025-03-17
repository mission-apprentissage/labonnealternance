import { Db } from "mongodb"
import { OPCOS_LABEL } from "shared/constants/index"

import { logger } from "@/common/logger"

export const up = async (db: Db) => {
  logger.info("20241014000000-cleaning-opco-missing-values started")

  await db.collection("entreprises").updateMany(
    {
      opco: { $in: ["Sélectionnez un OPCO", "", "pass"] },
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
  await db.collection("entreprises").updateMany(
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

  await db.collection("entreprises").updateMany(
    { opco: "Opco multiple" },
    {
      $set: {
        opco: OPCOS_LABEL.MULTIPLE_OPCO,
      },
    },
    {
      bypassDocumentValidation: true,
    }
  )
  await db.collection("entreprises").updateMany(
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
