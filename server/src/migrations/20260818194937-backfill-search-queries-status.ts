import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"

/**
 * #5168 rend `status: "ok" | "degraded" | "error"` obligatoire sur search_queries, mais tous
 * les documents déjà en base ont été écrits par l'ancien logSearchQuery, qui n'existait
 * qu'après succès de searchItems — implicitement des "ok". Sans ce backfill, le validateur
 * MongoDB (généré depuis le modèle Zod) les considère invalides et le job db:validate
 * (déclenché après chaque migrations:up) lève une exception Sentry fatal.
 */
export const up = async () => {
  const result = await getDbCollection("search_queries").updateMany({ status: { $exists: false } }, { $set: { status: "ok" } })
  logger.info(`backfill-search-queries-status: ${result.modifiedCount} document(s) mis à jour`)
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
