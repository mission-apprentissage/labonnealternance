import type { ObjectId } from "bson"

import { getDbCollection } from "@/common/utils/mongodb-utils"

const SEARCH_CORPUS_COLLECTIONS = ["search_jobs", "search_jobs_with_training", "search_trainings"] as const

/** Document indexé sous cet `_id`, quel que soit son corpus. */
export const findIndexed = async (_id: ObjectId) => {
  const docs = await Promise.all(SEARCH_CORPUS_COLLECTIONS.map((name) => getDbCollection(name).findOne({ _id })))
  return docs.find(Boolean) ?? null
}

/** Nombre d'occurrences de cet `_id` dans les corpus : 0 ou 1 attendu, 2 signale un doublon entre corpus. */
export const countIndexed = async (_id: ObjectId) => {
  const counts = await Promise.all(SEARCH_CORPUS_COLLECTIONS.map((name) => getDbCollection(name).countDocuments({ _id })))
  return counts.reduce((total, count) => total + count, 0)
}
