import { Db } from "mongodb"

import { logger } from "@/common/logger"

export const up = async (db: Db) => {
  logger.info("202407180000000-fix-appointments-applicant_id started")

  await db.collection("appointments").updateMany({ applicant_id: { $type: "string" } }, [{ $set: { applicant_id: { $toObjectId: "$applicant_id" } } }])

  logger.info("202407180000000-fix-appointments-applicant_id ended")
}
