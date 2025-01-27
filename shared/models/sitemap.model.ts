import { z } from "../helpers/zodWithOpenApi.js"

import { IModelDescriptor, zObjectId } from "./common.js"

export const ZSitemap = z
  .object({
    _id: zObjectId,
    created_at: z.date().describe("Date d'ajout en base de données"),
    xml: z.string(),
    hashcode: z.string().describe("hashcode du xml"),
  })
  .strict()

export type ISitemap = z.output<typeof ZSitemap>

export default {
  zod: ZSitemap,
  indexes: [],
  collectionName: "sitemaps" as const,
} as const satisfies IModelDescriptor
