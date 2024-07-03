import { z } from "zod"

import { IModelDescriptor } from "./common"

export default {
  zod: z.object({
    createdAt: z.date(),
  }),
  indexes: [],
  collectionName: "raw_hellowork",
} as const satisfies IModelDescriptor
