import { LBA_ITEM_TYPE } from "../constants/lbaitem"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { IModelDescriptor, zObjectId } from "./common"

export const ZReport = z
  .object({
    _id: zObjectId,
    type: extensions.buildEnum(LBA_ITEM_TYPE),
    itemId: z.string(),
    createdAt: z.coerce.date(),
  })
  .strict()

export type IReport = z.output<typeof ZReport>

export default {
  zod: ZReport,
  indexes: [[{ itemId: 1 }, {}]],
  collectionName: "reports" as const,
} as const satisfies IModelDescriptor
