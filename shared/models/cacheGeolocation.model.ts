import { z } from "../helpers/zodWithOpenApi"

import { ZPointFeature } from "./address.model"
import { IModelDescriptor, zObjectId } from "./common"

const collectionName = "cache_geolocation" as const

export const ZCacheGeolocation = z.object({
  _id: zObjectId,
  address: z.string(),
  features: z.array(ZPointFeature),
})
export type ICacheGeolocation = z.output<typeof ZCacheGeolocation>

export default {
  zod: ZCacheGeolocation,
  indexes: [
    [{ address: 1 }, {}],
    [{ "features.geometry": "2dsphere" }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor
