import { LBA_ITEM_TYPE } from "../constants/lbaitem.js"
import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"

import { IModelDescriptor, zObjectId } from "./common.js"

export const ZReportedCompany = z
  .object({
    _id: zObjectId,
    type: extensions.buildEnum(LBA_ITEM_TYPE),
    itemId: z.string(),
    createdAt: z.coerce.date(),
    reason: z.string(),
    reasonDetails: z.string().nullish(),
    siret: extensions.siret.nullish(),
    partnerLabel: z.string().nullish(),
    jobTitle: z.string().nullish(),
    companyName: z.string().nullish(),
  })
  .strict()

export type IReportedCompany = z.output<typeof ZReportedCompany>

export default {
  zod: ZReportedCompany,
  indexes: [],
  collectionName: "reported_companies" as const,
} as const satisfies IModelDescriptor
