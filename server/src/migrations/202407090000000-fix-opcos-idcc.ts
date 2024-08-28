import { Db } from "mongodb"

import { logger } from "@/common/logger"

export const up = async (db: Db) => {
  logger.info("start 202407090000000-fix-opcos-idcc")
  await db.collection("opcos").updateMany({ idcc: { $type: "number" } }, [{ $set: { idcc: { $toString: "$idcc" } } }])
  logger.info("end 202407090000000-fix-opcos-idcc")
}
