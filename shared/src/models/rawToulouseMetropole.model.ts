import { z } from "zod"

import type { IModelDescriptor} from "./common.js";
import { zObjectId } from "./common.js"

export default {
  zod: z
    .object({
      _id: zObjectId,
      createdAt: z.date(),
    })
    .passthrough(),
  indexes: [],
  collectionName: "raw_toulouse_metropole",
  authorizeAdditionalProperties: true,
} as const satisfies IModelDescriptor
