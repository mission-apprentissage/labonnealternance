import { Db } from "mongodb"

import { logger } from "@/common/logger"

export const up = async (db: Db) => {
  logger.info("start 202407020000000-fix-recruiters-fields")
  await db.collection("recruiters").updateMany({ establishment_state: { $exists: true } }, { $unset: { establishment_state: 1 } })
  await db.collection("recruiters").updateMany({ contacts: { $exists: true } }, { $unset: { contacts: 1 } })
  logger.info("end 202407020000000-fix-recruiters-fields")
}
