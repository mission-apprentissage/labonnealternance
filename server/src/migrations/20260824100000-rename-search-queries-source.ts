import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"

/**
 * Renomme `source` en `search_source` sur search_queries : « source » est un paramètre réservé
 * de Plausible (attribution d'acquisition), le nom est banni de toute la chaîne (URL, API, base)
 * pour ne pas polluer les stats. Sans ce rename, les documents existants (TTL 180 jours)
 * n'auraient plus le champ requis par le validateur généré depuis le modèle Zod (db:validate),
 * et le job analyzeSearchQueries ne les verrait plus dans sa fenêtre glissante.
 *
 * Pendant le rolling deploy, les pods encore sur l'ancien code insèrent des documents avec
 * `source` : rejetés par le nouveau validateur, mais logSearchQuery est fire-and-forget et
 * avale l'erreur — quelques entrées de log perdues, la recherche elle-même n'est pas impactée.
 */
export const up = async () => {
  const result = await getDbCollection("search_queries").updateMany({ source: { $exists: true } }, { $rename: { source: "search_source" } })
  logger.info(`rename-search-queries-source: ${result.modifiedCount} document(s) renommé(s)`)
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
