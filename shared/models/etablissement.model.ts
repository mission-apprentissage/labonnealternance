import { Jsonify } from "type-fest"
import { z } from "zod"

import { extensions } from "../helpers/zodHelpers/zodPrimitives"

import { ZMailing } from "./appointments.model"
import { zObjectId } from "./common"

export const ZEtablissement = z
  .object({
    _id: zObjectId,
    formateur_siret: extensions.siret().nullable(),
    gestionnaire_siret: extensions.siret().nullable(),
    raison_sociale: z.string().nullable().openapi({
      example: "CAMPUS FONDERIE DE L'IMAGE",
    }),
    adresse: z.string().nullable(),
    formateur_address: z.string().nullable(),
    formateur_zip_code: z.string().nullable(),
    formateur_city: z.string().nullable(),
    gestionnaire_email: z.string().nullable(),
    premium_invitation_date: z.date().nullable(),
    premium_activation_date: z.date().nullable(),
    premium_refusal_date: z.date().nullable(),
    premium_affelnet_invitation_date: z.date().nullable(),
    premium_affelnet_activation_date: z.date().nullable(),
    premium_affelnet_refusal_date: z.date().nullable(),
    optout_invitation_date: z.date().nullable(),
    optout_activation_scheduled_date: z.date().nullable(),
    optout_activation_date: z.date().nullable(),
    optout_refusal_date: z.date().nullable(),
    mailing: z.array(ZMailing),
    last_catalogue_sync_date: z.date(),
    created_at: z.date(),
    affelnet_perimetre: z.boolean().nullable(),
    to_etablissement_emails: z.array(ZMailing),
  })
  .strict()
  .openapi("Etablissement")

export type IEtablissement = z.output<typeof ZEtablissement>
export type IEtablissementJson = Jsonify<z.input<typeof ZEtablissement>>
