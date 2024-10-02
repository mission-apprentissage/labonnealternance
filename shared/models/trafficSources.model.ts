import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { IModelDescriptor, zObjectId } from "./common"

const collectionName = "traffic_sources" as const

export enum TrafficType {
  USER = "USER",
  APPLICATION = "APPLICATION",
}
export const ZTrafficType = extensions.buildEnum(TrafficType)

export const ZTrafficSource = z.object({
  _id: zObjectId,
  user_id: zObjectId.nullable(),
  application_id: zObjectId.nullable(),
  traffic_type: ZTrafficType,
  utm_campaign: z.string().nullable(),
  referer: z.string().nullable(),
})
export type ITrafficSource = z.output<typeof ZTrafficSource>

export default {
  zod: ZTrafficSource,
  indexes: [
    [{ traffic_type: 1 }, {}],
    [{ utm_campaing: 1 }, {}],
    [{ referer: 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor
