import { logger } from "@/common/logger"
import { createIndexes, createSearchIndexes, dropIndexes } from "@/common/utils/mongodbUtils"
import { seedSearchSynonyms } from "./seedSearchSynonyms"

export const recreateIndexes = async ({ drop } = { drop: false }) => {
  if (drop) {
    logger.info("Drop all existing indexes...")
    await dropIndexes()
  }
  logger.info("Create all indexes...")
  await createIndexes()
  logger.info("All indexes successfully created !")

  logger.info("Seeding search synonyms...")
  try {
    await seedSearchSynonyms()
  } catch (err) {
    logger.error(`Failed to seed search synonyms: ${err}`)
  }

  logger.info("Create MongoDB Search indexes...")
  try {
    await createSearchIndexes()
    logger.info("MongoDB Search indexes done.")
  } catch (err) {
    logger.error(`Failed to create MongoDB Search indexes: ${err}`)
  }
}
