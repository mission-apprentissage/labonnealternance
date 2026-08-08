import { z } from "../helpers/zod-with-open-api.js"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

export const ZSitemap = z.strictObject({
  _id: zObjectId,
  created_at: z.date().describe("Date d'ajout en base de données"),
  xml: z.string(),
  hashcode: z.string().describe("hashcode du xml"),
})

export type ISitemap = z.output<typeof ZSitemap>

export default {
  zod: ZSitemap,
  indexes: [],
  collectionName: "sitemaps" as const,
} as const satisfies IModelDescriptor
