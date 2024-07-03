import { Db } from "mongodb"

import { logger } from "@/common/logger"

export const up = async (db: Db) => {
  await db.collection("bonnesboites").rename("recruteurslba")
  await db.collection("unsubscribedbonnesboites").rename("unsubscribedrecruteurslba")

  logger.info("202407030000000-migrate-rename-bonnesboites ended")
}
