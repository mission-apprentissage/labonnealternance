import { z } from "zod"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

export default {
  zod: z.looseObject({
    _id: zObjectId,
    createdAt: z.date(),
  }),
  indexes: [],
  collectionName: "raw_nos_talents_nos_emplois",
  authorizeAdditionalProperties: true,
} as const satisfies IModelDescriptor
