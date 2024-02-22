import { Jsonify } from "type-fest"

import { z } from "../helpers/zodWithOpenApi"

import { ZGlobalAddress } from "./address.model"
import { zObjectId } from "./common"

export const ZEntreprise = z
  .object({
    _id: zObjectId,
    origin: z.string().nullish(),
    createdAt: z.date(),
    updatedAt: z.date(),
    siret: z.string(),
    raison_sociale: z.string().nullish(),
    enseigne: z.string().nullish(),
    idcc: z.string().nullish(),
    address: z.string().nullish(),
    address_detail: ZGlobalAddress.nullish(),
    geo_coordinates: z.string().nullish(),
    opco: z.string().nullish(),

    establishment_id: z.string().nullish(),
  })
  .strict()

export type IEntreprise = z.output<typeof ZEntreprise>
export type IEntrepriseJson = Jsonify<z.input<typeof ZEntreprise>>
