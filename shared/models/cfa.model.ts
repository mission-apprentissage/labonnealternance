import { Jsonify } from "type-fest"

import { z } from "../helpers/zodWithOpenApi.js"

import { ZGlobalAddress } from "./address.model.js"
import { IModelDescriptor, zObjectId } from "./common.js"

const collectionName = "cfas" as const

export const zCFA = z
  .object({
    _id: zObjectId,
    origin: z.string().nullish(),
    createdAt: z.date(),
    updatedAt: z.date(),
    siret: z.string(),
    raison_sociale: z.string().nullish(),
    enseigne: z.string().nullish(),
    address_detail: ZGlobalAddress.nullish(),
    address: z.string().nullish(),
    geo_coordinates: z.string().nullish(),
  })
  .strict()

export type ICFA = z.output<typeof zCFA>
export type ICFAJson = Jsonify<z.input<typeof zCFA>>

export default {
  zod: zCFA,
  indexes: [[{ siret: 1 }, { unique: true }]],
  collectionName,
} as const satisfies IModelDescriptor
