import { z } from "zod"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

const collectionName = "search_synonyms" as const

const ZSearchSynonym = z.object({
  _id: zObjectId,
  mappingType: z.literal("equivalent"),
  synonyms: z.array(z.string()),
})

export type ISearchSynonym = z.output<typeof ZSearchSynonym>

export default {
  zod: ZSearchSynonym,
  indexes: [],
  collectionName,
  authorizeAdditionalProperties: false,
} as const satisfies IModelDescriptor
