import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"

import { IModelDescriptor, zObjectId } from "./common.js"

const collectionName = "algolia" as const

export const ZAlgolia = z
  .object({
    _id: zObjectId,
    objectID: z.string(), // id obligatoire algolia = _id mongodb
    type: z.enum(["formation", "offre"]),
    sub_type: z.enum(["offre-partenaire", "offre-labonnealternance", "candidature-spontannée", "formation-presentiel", "formation-a-distance"]),
    title: z.string(), // formation -> intitule_rco | offre: offer_title
    description: z.string(), // formation -> contenue | offer: offer_description
    address: z.string(),
    _geoloc: z.object({
      lat: extensions.latitude({ coerce: false }),
      lng: extensions.longitude({ coerce: false }),
    }),
    organization_name: z.string(),
    level: z.string(),
    activity_sector: z.string().nullable(),
  })
  .strict()
export type IAlgolia = z.output<typeof ZAlgolia>

export default {
  zod: ZAlgolia,
  indexes: [],
  collectionName,
} as const satisfies IModelDescriptor
