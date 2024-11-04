import { z } from "zod"

import { IModelDescriptor, zObjectId } from "./common"

export default {
  zod: z
    .object({
      _id: zObjectId,
      createdAt: z.date(),
    })
    .passthrough(),
  indexes: [],
  collectionName: "raw_hellowork",
  authorizeAdditionalProperties: true,
} as const satisfies IModelDescriptor
