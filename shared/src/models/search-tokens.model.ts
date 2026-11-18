import { z } from "zod"

import type { IModelDescriptor } from "./common.js"

const collectionName = "search_tokens" as const

/**
 * Consommation des jetons de recherche du site (cf. shared/utils/search-token). `_id` = nonce du défi
 * ALTCHA résolu : rejouer une même solution redonne le même jeton, donc le même compteur.
 */
export const ZSearchToken = z.object({
  _id: z.string(),
  count: z.number().describe("Recherches servies avec ce jeton (les suggestions ne comptent pas)"),
  created_at: z.date(),
  expires_at: z.date().describe("Purge TTL, au-delà de la durée de vie maximale du jeton"),
})

export type ISearchToken = z.output<typeof ZSearchToken>

export default {
  zod: ZSearchToken,
  indexes: [[{ expires_at: 1 }, { expireAfterSeconds: 0 }]],
  collectionName,
} as const satisfies IModelDescriptor
