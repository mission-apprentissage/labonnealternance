import { LBA_ITEM_TYPE } from "../constants/lbaitem"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { IModelDescriptor, zObjectId } from "./common"

export const ZReportedCompany = z
  .object({
    _id: zObjectId,
    type: extensions.buildEnum(LBA_ITEM_TYPE),
    itemId: z.string(),
    createdAt: z.coerce.date(),
  })
  .strict()

export type IReportedCompany = z.output<typeof ZReportedCompany>

export default {
  zod: ZReportedCompany,
  indexes: [[{ itemId: 1 }, {}]],
  collectionName: "reported_companies" as const,
} as const satisfies IModelDescriptor
