import { Db } from "mongodb"

import { logger } from "@/common/logger"

export const up = async (db: Db) => {
  await db.collection("siretdiffusiblestatuses").drop()

  logger.info("20241209090516-remove_siretdiffusible_statuses")
}
