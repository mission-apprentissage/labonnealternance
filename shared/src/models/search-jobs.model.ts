import type { z } from "zod"

import type { IModelDescriptor } from "./common.js"
import { SEARCH_ITEM_INDEX_DEFINITION, SEARCH_ITEM_INDEXES, ZSearchItem } from "./search-items.model.js"

/**
 * Corpus des modes « emplois » (`search_jobs`) et « emplois avec formation incluse »
 * (`search_jobs_with_training`, offres `is_formation_included`) : même schéma, même pipeline,
 * seule la collection change (#5389).
 */
export const ZSearchJob = ZSearchItem

export type ISearchJob = z.output<typeof ZSearchJob>

export const searchJobsWithTrainingModel = {
  zod: ZSearchJob,
  indexes: SEARCH_ITEM_INDEXES,
  searchIndexes: [{ name: "search_jobs_with_training_index", definition: SEARCH_ITEM_INDEX_DEFINITION }],
  collectionName: "search_jobs_with_training",
} as const satisfies IModelDescriptor

export default {
  zod: ZSearchJob,
  indexes: SEARCH_ITEM_INDEXES,
  searchIndexes: [{ name: "search_jobs_index", definition: SEARCH_ITEM_INDEX_DEFINITION }],
  collectionName: "search_jobs",
} as const satisfies IModelDescriptor
