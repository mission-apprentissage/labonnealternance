import { z } from "../helpers/zodWithOpenApi"

import { Z2DCoord } from "./address.model"
import { IModelDescriptor, zObjectId } from "./common"

const collectionName = "cache_geolocation" as const

const ZPointGeometry = z.object({
  type: z.literal("Point"),
  coordinates: Z2DCoord,
})

const ZPointProperties = z
  .object({
    label: z.string(),
    score: z.number(),
    housenumber: z.string().nullish(),
    id: z.string(),
    banId: z.string().nullish(),
    type: z.string(),
    name: z.string(),
    postcode: z.string().nullish(),
    citycode: z.string().nullish(),
    x: z.number(),
    y: z.number(),
    city: z.string().nullish(),
    municipality: z.string().nullish(),
    population: z.number().nullish(),
    district: z.string().nullish(),
    locality: z.string().nullish(),
    context: z.string(),
    importance: z.number(),
    street: z.string().nullish(),
  })
  .passthrough()

const ZPointFeature = z.object({
  type: z.literal("Feature"),
  geometry: ZPointGeometry,
  properties: ZPointProperties,
})

export type IPointFeature = z.output<typeof ZPointFeature>
export type IPointProperties = z.output<typeof ZPointProperties>
export type IPointGeometry = z.output<typeof ZPointGeometry>

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
