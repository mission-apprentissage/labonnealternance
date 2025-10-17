import { RECRUITER_STATUS } from "shared/constants/recruteur"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  logger.info("Starting migration: clean dual cfa entreprise recruiters")

  const now = new Date()
  await getDbCollection("recruiters").updateMany(
    {
      $expr: { $eq: ["$establishment_siret", "$cfa_delegated_siret"] },
    },
    { $set: { updatedAt: now, status: RECRUITER_STATUS.ARCHIVE } }
  )

  logger.info("Migration completed: clean dual cfa entreprise recruiters")
}

export const requireShutdown: boolean = false
