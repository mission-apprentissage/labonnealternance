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

export const ZGeoLocationNew = ZGeoLocation.omit({ _id: true }).strict()

export default {
  zod: ZGeoLocation,
  indexes: [],
  collectionName,
} as const satisfies IModelDescriptor
