import { TRAINING_CONTRACT_TYPE } from "../constants/recruteur.js"
import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"

import { IModelDescriptor, zObjectId } from "./common.js"

const collectionName = "algolia" as const

export const ZAlgolia = z
  .object({
    _id: zObjectId,
    objectID: z.string(), // id obligatoire algolia = _id mongodb
    url_id: z.string(),
    type: z.enum(["formation", "offre"]),
    sub_type: z.string(),
    type_filter_label: z.string(),
    contract_type: z.array(extensions.buildEnum(TRAINING_CONTRACT_TYPE)).nullable(),
    publication_date: z.number().nullable(),
    smart_apply: z.boolean().nullable(),
    application_count: z.number().nullable(),
    title: z.string(), // formation -> intitule_rco | offre: offer_title
    description: z.string(), // formation -> contenue | offer: offer_description | recruteurs_lba : intitule romes des 6 premiers code_romes
    address: z.string(),
    _geoloc: z.object({
      lat: extensions.latitude({ coerce: false }),
      lng: extensions.longitude({ coerce: false }),
    }),
    organization_name: z.string(),
    level: z.string(),
    activity_sector: z.string().nullable(),
    keywords: z.array(z.string()).nullable(),
  })
  .strict()
export type IAlgolia = z.output<typeof ZAlgolia>

export default {
  zod: ZAlgolia,
  indexes: [],
  collectionName,
} as const satisfies IModelDescriptor
