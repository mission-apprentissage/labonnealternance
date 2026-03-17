import { execSync } from "child_process"
import path from "path"

import { logger } from "@/common/logger"
import { createIndexes, dropIndexes } from "@/common/utils/mongodbUtils"

export const recreateIndexes = async ({ drop } = { drop: false }) => {
  if (drop) {
    logger.info("Drop all existing indexes...")
    await dropIndexes()
  }
  logger.info("Create all indexes...")
  await createIndexes()
  logger.info("All indexes successfully created !")

  logger.info("Create MongoDB Search indexes...")
  try {
    const script = path.resolve(process.cwd(), "../.infra/files/scripts/create-search-indexes.sh")
    execSync(`bash "${script}"`, { stdio: "inherit" })
    logger.info("MongoDB Search indexes done.")
  } catch (err) {
    logger.error(`Failed to create MongoDB Search indexes: ${err}`)
  }
}
