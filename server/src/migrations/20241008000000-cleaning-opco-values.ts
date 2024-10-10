import { Db } from "mongodb"
import { OPCOS_LABEL } from "shared/constants"

import { logger } from "@/common/logger"

export const up = async (db: Db) => {
  logger.info("20241008000000-cleaning-opco-values started")

  await db.collection("entreprise").updateMany(
    {
      opco: { $in: ["Sélectionnez un OPCO", "", "pass"] },
    },
    {
      $set: {
        opco: OPCOS_LABEL.UNKNOWN_OPCO,
      },
    }
  )
  await db.collection("recruiters").updateMany(
    {
      opco: { $in: ["Sélectionnez un OPCO", "", "pass"] },
    },
    {
      $set: {
        opco: OPCOS_LABEL.UNKNOWN_OPCO,
      },
    }
  )

  await db.collection("entreprise").updateMany(
    { opco: "Opco multiple" },
    {
      $set: {
        opco: OPCOS_LABEL.MULTIPLE_OPCO,
      },
    }
  )
  await db.collection("recruiters").updateMany(
    { opco: "Opco multiple" },
    {
      $set: {
        opco: OPCOS_LABEL.MULTIPLE_OPCO,
      },
    }
  )

  logger.info("20241008000000-cleaning-opco-values ended")
}
