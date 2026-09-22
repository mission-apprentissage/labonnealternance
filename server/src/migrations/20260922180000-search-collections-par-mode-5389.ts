import searchJobsModel, { searchJobsWithTrainingModel } from "shared/models/search-jobs.model"
import searchTrainingsModel from "shared/models/search-trainings.model"

import { logger } from "@/common/logger"
import { getDatabase, getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"

const LEGACY_KEYWORDS_COLLECTION = "search_items_keywords"

/**
 * `configureDbSchemaValidation` crée `search_jobs_keywords` vide au démarrage de la CLI, avant
 * les migrations : `dropTarget` ne remplace donc qu'une collection vide. Si des entrées y ont
 * déjà été écrites, les deux caches sont fusionnés.
 */
const renameKeywordsCache = async () => {
  const db = getDatabase()
  const [legacy] = await db.listCollections({ name: LEGACY_KEYWORDS_COLLECTION }).toArray()
  if (!legacy) {
    logger.info(`${LEGACY_KEYWORDS_COLLECTION} absente, rien à renommer`)
    return
  }
  if ((await getDbCollection("search_jobs_keywords").estimatedDocumentCount()) === 0) {
    await db.renameCollection(LEGACY_KEYWORDS_COLLECTION, "search_jobs_keywords", { dropTarget: true })
    logger.info(`${LEGACY_KEYWORDS_COLLECTION} renommée search_jobs_keywords`)
    return
  }
  // `$merge` exige un index unique sur `on` ; createIndexes peut ne pas être encore passé sur la nouvelle collection.
  await getDbCollection("search_jobs_keywords").createIndex({ source_hash: 1 }, { unique: true })
  await db
    .collection(LEGACY_KEYWORDS_COLLECTION)
    .aggregate([{ $merge: { into: "search_jobs_keywords", on: "source_hash", whenMatched: "keepExisting", whenNotMatched: "insert" } }], { bypassDocumentValidation: true })
    .toArray()
  await db.dropCollection(LEGACY_KEYWORDS_COLLECTION)
  logger.info(`${LEGACY_KEYWORDS_COLLECTION} fusionnée dans search_jobs_keywords puis supprimée`)
}

const CORPUS_FILTERS = [
  { into: "search_jobs", match: { type: "offre", is_formation_included: { $ne: true } } },
  { into: "search_jobs_with_training", match: { type: "offre", is_formation_included: true } },
  { into: "search_trainings", match: { type: "formation" } },
] as const

/**
 * Crée seulement les index absents, sans passer par `createSearchIndexes` : son `updateSearchIndex`
 * relance un build complet de chaque index existant même à définition identique (version
 * incrémentée, statut BUILDING), `search_items_index` compris.
 */
const createCorpusSearchIndexes = async () => {
  for (const { collectionName, searchIndexes } of [searchJobsModel, searchJobsWithTrainingModel, searchTrainingsModel]) {
    const collection = getDbCollection(collectionName)
    let existing: (string | undefined)[]
    try {
      existing = (await collection.listSearchIndexes().toArray()).map((index) => index.name)
    } catch (err) {
      // Environnements sans mongot (CI) : même repli que createSearchIndexes, mais remonté à Sentry
      // car en prod l'index manquant ne se verrait qu'au contrôle post-MEP.
      sentryCaptureException(err)
      logger.error({ err }, `Search indexes indisponibles pour ${collectionName} (mongot absent ?)`)
      continue
    }
    for (const searchIndex of searchIndexes) {
      if (existing.includes(searchIndex.name)) continue
      await collection.createSearchIndex(searchIndex)
      logger.info(`Search index ${searchIndex.name} créé sur ${collectionName}`)
    }
  }
}

/**
 * Double écriture `search_items` → une collection par mode (#5389). La copie par `$merge` reprend
 * les keywords Mistral et prend quelques minutes, là où `fillSearchItemsCollection` réécrit chaque
 * item un par un. Les lectures restent sur `search_items_index`, qui n'est pas reconstruit : seuls
 * les trois nouveaux index se construisent, en arrière-plan.
 *
 * Contrôle après coup, dans Compass sur chaque collection :
 *   [{ $listSearchIndexes: {} }] → status READY, queryable true
 * et `controlSearchItemsDrift` compare chaque collection à sa part de `search_items`.
 */
export const up = async () => {
  await renameKeywordsCache()

  const batches = await getDbCollection("mistral_batch_jobs").updateMany(
    // Valeur retirée de l'enum Zod : le filtre passe par un cast.
    { kind: LEGACY_KEYWORDS_COLLECTION as "search_jobs_keywords" },
    { $set: { kind: "search_jobs_keywords" } },
    { bypassDocumentValidation: true }
  )
  logger.info(`mistral_batch_jobs : ${batches.modifiedCount} job(s) passés au kind search_jobs_keywords`)

  for (const { into, match } of CORPUS_FILTERS) {
    await getDbCollection("search_items")
      .aggregate([{ $match: match }, { $merge: { into, on: "_id", whenMatched: "keepExisting", whenNotMatched: "insert" } }], { bypassDocumentValidation: true })
      .toArray()
    logger.info(`${into} : ${await getDbCollection(into).estimatedDocumentCount()} documents après copie depuis search_items`)
  }

  await createCorpusSearchIndexes()
}

export const requireShutdown: boolean = false
