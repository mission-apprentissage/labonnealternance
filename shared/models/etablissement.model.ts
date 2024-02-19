import { Jsonify } from "type-fest"

import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { zObjectId } from "./common"

export const ZEtablissement = z
  .object({
    _id: zObjectId,
    formateur_siret: extensions.siret.nullish(),
    gestionnaire_siret: extensions.siret.nullish(),
    raison_sociale: z.string().nullable().openapi({
      example: "CAMPUS FONDERIE DE L'IMAGE",
    }),
    adresse: z.string().nullish(),
    formateur_address: z.string().nullish(),
    formateur_zip_code: z.string().nullish(),
    formateur_city: z.string().nullish(),
    gestionnaire_email: z.string().nullish(),
    premium_invitation_date: z.date().nullish(),
    premium_activation_date: z.date().nullish(),
    premium_refusal_date: z.date().nullish(),
    premium_follow_up_date: z.date().nullish(),
    premium_affelnet_invitation_date: z.date().nullish(),
    premium_affelnet_activation_date: z.date().nullish(),
    premium_affelnet_refusal_date: z.date().nullish(),
    premium_affelnet_follow_up_date: z.date().nullish(),
    optout_invitation_date: z.date().nullish(),
    optout_activation_scheduled_date: z.date().nullish(),
    optout_activation_date: z.date().nullish(),
    optout_refusal_date: z.date().nullish(),
    last_catalogue_sync_date: z.date().nullish(),
    created_at: z.date().nullish(),
  })
  .strict()
  .openapi("Etablissement")

export type IEtablissement = z.output<typeof ZEtablissement>
export type IEtablissementJson = Jsonify<z.input<typeof ZEtablissement>>
