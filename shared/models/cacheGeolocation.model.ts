import { z } from "../helpers/zodWithOpenApi.js"

import { ZPointFeature } from "./address.model.js"
import { IModelDescriptor, zObjectId } from "./common.js"

const collectionName = "cache_geolocation" as const

export const ZCacheGeolocation = z.object({
  _id: zObjectId,
  address: z.string(),
  features: z.array(ZPointFeature),
})
export type ICacheGeolocation = z.output<typeof ZCacheGeolocation>

export default {
  zod: ZCacheGeolocation,
  indexes: [[{ address: 1 }, {}]],
  collectionName,
} as const satisfies IModelDescriptor
