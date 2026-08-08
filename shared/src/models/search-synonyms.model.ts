import { z } from "zod"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

const collectionName = "search_synonyms" as const

const ZSearchSynonym = z.object({
  _id: zObjectId,
  mappingType: z.literal("equivalent"),
  synonyms: z.array(z.string()),
  // Champs de traçabilité (mongot ne lit que mappingType/synonyms — sans effet sur l'index).
  // origin absent = groupe du seed historique ; "user_queries" = inséré par analyzeSearchQueries.
  origin: z.enum(["seed", "user_queries"]).optional(),
  run_id: z.string().optional().describe("Run d'analyse à l'origine du groupe (rollback)"),
  created_at: z.date().optional(),
})

export type ISearchSynonym = z.output<typeof ZSearchSynonym>

export default {
  zod: ZSearchSynonym,
  indexes: [],
  collectionName,
  authorizeAdditionalProperties: false,
} as const satisfies IModelDescriptor
