import { logger } from "@/common/logger"
import { getDatabase } from "@/common/utils/mongodb-utils"

// Collections hors modèles depuis la bascule sur une collection par mode (#5389) : accès non typé.
const OBSOLETE_COLLECTIONS = ["search_items", "search_items_keywords"] as const

/**
 * Supprime `search_items` et son index Atlas Search une fois les lectures servies par les collections
 * par mode. `search_items_keywords` n'existe plus qu'en reliquat éventuel du renommage en
 * `search_jobs_keywords`. Absentes sur une base fraîche : rien à faire.
 */
export const up = async () => {
  const db = getDatabase()
  for (const name of OBSOLETE_COLLECTIONS) {
    const [collection] = await db.listCollections({ name }).toArray()
    if (!collection) {
      logger.info(`${name} absente, rien à supprimer`)
      continue
    }
    const count = await db.collection(name).estimatedDocumentCount()
    await db.dropCollection(name)
    logger.info(`${name} supprimée (${count} documents)`)
  }
}

export const requireShutdown: boolean = false
