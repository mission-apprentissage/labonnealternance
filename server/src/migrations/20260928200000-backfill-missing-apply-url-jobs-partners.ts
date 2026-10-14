import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"

/**
 * Pose `apply_url: null` sur les offres qui n'ont pas le champ : les offres LBA créées avant #2728 ne
 * le renseignaient pas. Le schéma l'exige, et hors production le validateur est en `error` : toute
 * mise à jour de ces offres échoue en code 121, quel que soit le champ modifié. Les lectures traitent
 * absent et `null` à l'identique (cf. buildApplyUrlFromJob).
 *
 * Mesuré en production le 28/09/2026 : 71 374 offres sans le champ, toutes OFFRES_EMPLOI_LBA, sur
 * 71 375 documents invalides remontés par db:validate.
 *
 * `bypassDocumentValidation` : ces offres peuvent enfreindre d'autres règles du schéma courant.
 */
export const up = async () => {
  const { modifiedCount } = await getDbCollection("jobs_partners").updateMany({ apply_url: { $exists: false } }, { $set: { apply_url: null } }, { bypassDocumentValidation: true })

  logger.info(`backfill apply_url : ${modifiedCount} offres jobs_partners complétées`)
}

export const requireShutdown: boolean = false
