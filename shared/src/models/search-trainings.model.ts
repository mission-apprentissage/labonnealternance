import type { z } from "zod"

import type { IModelDescriptor } from "./common.js"
import { SEARCH_ITEM_INDEX_DEFINITION, SEARCH_ITEM_INDEXES, ZSearchItem } from "./search-corpus.model.js"

/** Corpus du mode « formations » : catalogue RCO (#5389). */
export const ZSearchTraining = ZSearchItem

export type ISearchTraining = z.output<typeof ZSearchTraining>

export default {
  zod: ZSearchTraining,
  indexes: SEARCH_ITEM_INDEXES,
  searchIndexes: [{ name: "search_trainings_index", definition: SEARCH_ITEM_INDEX_DEFINITION }],
  collectionName: "search_trainings",
} as const satisfies IModelDescriptor
