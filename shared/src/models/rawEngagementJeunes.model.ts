import { z } from "zod"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

export const rawEngagementJeunesModel = {
  zod: z
    .object({
      _id: zObjectId,
      createdAt: z.date(),
    })
    .passthrough(),
  indexes: [],
  collectionName: "raw_engagement_jeunes",
  authorizeAdditionalProperties: true,
} as const satisfies IModelDescriptor

export default rawEngagementJeunesModel
