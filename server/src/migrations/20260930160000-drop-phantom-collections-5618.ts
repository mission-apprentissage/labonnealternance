import { logger } from "@/common/logger"
import { getDatabase } from "@/common/utils/mongodb-utils"

const PHANTOM_COLLECTIONS = ["recruiters", "geolocations", "anonymized_recruiters", "raw_monster"]

export const up = async () => {
  const db = getDatabase()
  const existing = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map(({ name }) => name))

  for (const name of PHANTOM_COLLECTIONS) {
    if (!existing.has(name)) continue
    await db.dropCollection(name)
    logger.info(`collection ${name} supprimée`)
  }
}

export const requireShutdown: boolean = false
