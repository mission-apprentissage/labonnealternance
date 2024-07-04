import { Db } from "mongodb"

import { logger } from "@/common/logger"

export const up = async (db: Db) => {
  logger.info("202407030000000-migrate-rename-bonnesboites started")

  await db.collection("bonnesboites").rename("recruteurslba")
  await db.collection("unsubscribedbonnesboites").rename("unsubscribedrecruteurslba")
  await db.collection("bonnesboiteslegacies").rename("recruteurslbalegacies")

  logger.info("202407030000000-migrate-rename-bonnesboites ended")
}
