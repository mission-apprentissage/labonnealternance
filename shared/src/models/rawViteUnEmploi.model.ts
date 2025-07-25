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
  collectionName: "raw_vite_un_emploi",
  authorizeAdditionalProperties: true,
} as const satisfies IModelDescriptor
