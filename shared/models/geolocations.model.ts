import { z } from "../helpers/zodWithOpenApi"

import { zObjectId } from "./common"

export const ZGeoLocation = z
  .object({
    _id: zObjectId,
    address: z.string(),
    city: z.string(),
    geo_coordinates: z.string(),
    zip_code: z.string(),
  })
  .strict()
