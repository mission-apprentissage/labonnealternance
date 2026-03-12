import { z } from "zod"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

export default {
  zod: z
    .object({
      _id: zObjectId,
      createdAt: z.date(),
    })
    .passthrough(),
  indexes: [
    [{ "job.reference": 1 }, {}],
    [{ ref_start: 1 }, {}],
  ],
  collectionName: "raw_hellowork_buddi",
  authorizeAdditionalProperties: true,
} as const satisfies IModelDescriptor
