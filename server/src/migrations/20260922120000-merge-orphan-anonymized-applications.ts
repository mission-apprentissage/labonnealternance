import anonymizedApplicationsModel from "shared/models/anonymized-applications.model"

import { logger } from "@/common/logger"
import { getDatabase } from "@/common/utils/mongodb-utils"

/**
 * Reprise des candidatures anonymisées écrites dans une collection hors modèles.
 *
 * Le cron « Anonymisation des candidatures de plus de deux (2) ans » ciblait
 * `anonymizedapplications` (sans underscore) via une chaîne en dur, alors que le modèle déclare
 * `anonymized_applications`. La collection orpheline n'était donc couverte ni par les modèles, ni
 * par `obfuscateCollections` (qui liste bien `anonymized_applications`), et les statistiques de
 * rétention lues sur la collection déclarée ignoraient tout ce que ce cron y avait déposé.
 *
 * Le `$merge` se fait sur `_id`, ce qui rend la reprise rejouable et absorbe un `_id` dupliqué à
 * l'intérieur de la collection orpheline. Il ne rattrape en revanche aucun doublon avec l'autre
 * chemin d'anonymisation : `anonymizeApplicantsAndApplications` projette `{ _id: 0 }` puis
 * `insertMany`, donc ses documents portent un `_id` régénéré, sans rapport avec celui de la
 * candidature d'origine que conserve le cron repris ici.
 *
 * `requireShutdown: false` est sans risque de course avec le cron : `deploy.yml` scale
 * `lba_jobs_processor` à 0 dès qu'une migration est en attente, avant de lancer `migrations-up.sh`.
 */

const LEGACY_COLLECTION_NAME = "anonymizedapplications"

export const up = async () => {
  const db = getDatabase()

  const [legacyCollection] = await db.listCollections({ name: LEGACY_COLLECTION_NAME }).toArray()
  if (!legacyCollection) {
    logger.info(`Collection ${LEGACY_COLLECTION_NAME} absente, rien à reprendre`)
    return
  }

  const legacyCount = await db.collection(LEGACY_COLLECTION_NAME).countDocuments()
  logger.info(`Reprise de ${legacyCount} document(s) depuis ${LEGACY_COLLECTION_NAME} vers ${anonymizedApplicationsModel.collectionName}`)

  if (legacyCount > 0) {
    await db
      .collection(LEGACY_COLLECTION_NAME)
      .aggregate([
        {
          $merge: {
            into: anonymizedApplicationsModel.collectionName,
            on: "_id",
            whenMatched: "merge",
            whenNotMatched: "insert",
          },
        },
      ])
      .toArray()
  }

  await db.dropCollection(LEGACY_COLLECTION_NAME)
  logger.info(`Collection ${LEGACY_COLLECTION_NAME} supprimée`)
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
