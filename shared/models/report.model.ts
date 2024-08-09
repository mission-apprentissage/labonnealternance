import { LBA_ITEM_TYPE } from "../constants/lbaitem"
import { z } from "../helpers/zodWithOpenApi"

import { IModelDescriptor, zObjectId } from "./common"
import { enumToZod } from "./enumToZod"

export const ZReport = z
  .object({
    _id: zObjectId,
    type: enumToZod(LBA_ITEM_TYPE),
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
