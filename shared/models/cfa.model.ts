import { Jsonify } from "type-fest"

import { z } from "../helpers/zodWithOpenApi"

import { ZGlobalAddress } from "./address.model"
import { zObjectId } from "./common"

export const zCFA = z
  .object({
    _id: zObjectId,
    establishment_siret: z.string(),
    establishment_raison_sociale: z.string().nullish(),
    establishment_enseigne: z.string().nullish(),
    address_detail: ZGlobalAddress.nullish(),
    address: z.string().nullish(),
    geo_coordinates: z.string().nullish(),
    origin: z.string().nullish(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict()

export type ICFA = z.output<typeof zCFA>
export type ICFAJson = Jsonify<z.input<typeof zCFA>>
