import { z } from "../helpers/zodWithOpenApi"

import { IModelDescriptor, zObjectId } from "./common"

const collectionName = "geolocations" as const

export const ZGeoLocation = z
  .object({
    _id: zObjectId.nullish(),
    address: z.string(),
    city: z.string(),
    geo_coordinates: z.string(),
    zip_code: z.string(),
  })
  .strict()

export type IGeoLocation = z.output<typeof ZGeoLocation>

export default {
  zod: ZGeoLocation,
  indexes: [[{ address: 1 }, { unique: true }]],
  collectionName,
} as const satisfies IModelDescriptor
