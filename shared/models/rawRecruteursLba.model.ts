import { z } from "zod"

import { IModelDescriptor, zObjectId } from "./common.js"

export default {
  zod: z
    .object({
      _id: zObjectId,
      createdAt: z.date(),
    })
    .passthrough(),
  indexes: [],
  collectionName: "raw_recruteurslba",
  authorizeAdditionalProperties: true,
} as const satisfies IModelDescriptor
