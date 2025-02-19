import { Jsonify } from "type-fest"

import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"

import { IModelDescriptor, zObjectId } from "./common.js"

const collectionName = "etablissements" as const

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
    to_CFA_invite_optout_last_message_id: z.string().nullish(),
    created_at: z.date().nullish(),
  })
  .strict()
  .openapi("Etablissement")

export type IEtablissement = z.output<typeof ZEtablissement>
export type IEtablissementJson = Jsonify<z.input<typeof ZEtablissement>>

export default {
  zod: ZEtablissement,
  indexes: [
    [{ formateur_siret: 1 }, {}],
    [{ gestionnaire_siret: 1 }, {}],
    [{ premium_activation_date: 1 }, {}],
    [{ premium_affelnet_activation_date: 1 }, {}],
    [{ to_CFA_invite_optout_last_message_id: 1 }, {}],
    [{ optout_activation_date: 1 }, {}],
  ],

  collectionName,
} as const satisfies IModelDescriptor
