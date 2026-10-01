import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"

/**
 * Retire le champ stocké `applicationCount` de jobs_partners : initialisé à 0 à la création d'une
 * offre LBA, jamais incrémenté ni lu. Le compteur affiché est calculé depuis `applications`
 * (cf. getApplicationByJobCount).
 *
 * `bypassDocumentValidation` : des offres anciennes ne respectent pas le schéma actuel.
 */
export const up = async () => {
  const { modifiedCount } = await getDbCollection("jobs_partners").updateMany(
    { applicationCount: { $exists: true } },
    { $unset: { applicationCount: "" } },
    { bypassDocumentValidation: true }
  )
  logger.info(`unset applicationCount : ${modifiedCount} offres mises à jour`)
}

export const requireShutdown: boolean = false
