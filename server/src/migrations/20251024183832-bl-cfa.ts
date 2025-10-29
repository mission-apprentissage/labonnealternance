import { JOB_STATUS_ENGLISH } from "shared"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  logger.info("Migration 20251024183832-bl-cfa started")
  const now = new Date()
  await getDbCollection("jobs_partners").updateMany(
    {
      workplace_name: {
        $in: ["STUDI CFA", "WALTER LEARNING", "EMPLOI LR", "ATOUT PRO HDF", "ACADEMEE CFA", "CBS - CHALLENGE BUSINESS SCHOOL"],
      },
    },
    { $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE, updated_at: now } }
  )

  logger.info("Migration 20251024183832-bl-cfa completed")
}

export const requireShutdown: boolean = false
