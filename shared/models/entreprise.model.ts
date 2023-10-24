import { Jsonify } from "type-fest"

import { z } from "../helpers/zodWithOpenApi"

import { ZGlobalAddress } from "./address.model"

export const ZEntreprise = z
  .object({
    establishment_siret: z.string(),
    opco: z.string().nullish(),
    idcc: z.string().nullish(),
    establishment_raison_sociale: z.string().nullish(),
    establishment_enseigne: z.string().nullish(),
    address_detail: ZGlobalAddress.nullish(),
    address: z.string().nullish(),
    geo_coordinates: z.string().nullish(),
    origin: z.string().nullish(),
    establishment_id: z.string().nullish(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict()

export type IEntreprise = z.output<typeof ZEntreprise>
export type IEntrepriseJson = Jsonify<z.input<typeof ZEntreprise>>
