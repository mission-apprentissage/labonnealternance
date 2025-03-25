import { z } from "zod"

import { IModelDescriptor } from "./common.js"

export default {
  zod: z
    .object({
      createdAt: z.date(),
    })
    .passthrough(),
  indexes: [],
  collectionName: "raw_kelio",
} as const satisfies IModelDescriptor
