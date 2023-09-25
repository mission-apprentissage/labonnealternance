import { Jsonify } from "type-fest"
import { z } from "zod"

import { extensions } from "../helpers/zodHelpers/zodPrimitives"

import { ZMailing } from "./appointments.model"
import { zObjectId } from "./common"

export const ZEtablissement = z
  .object({
    _id: zObjectId,
    formateur_siret: extensions.siret(),
    gestionnaire_siret: extensions.siret(),
    raison_sociale: z.string(),
    adresse: z.string(),
    formateur_address: z.string(),
    formateur_zip_code: z.string(),
    formateur_city: z.string(),
    gestionnaire_email: z.string(),
    premium_invitation_date: z.date(),
    premium_activation_date: z.date(),
    premium_refusal_date: z.date(),
    premium_affelnet_invitation_date: z.date(),
    premium_affelnet_activation_date: z.date(),
    premium_affelnet_refusal_date: z.date(),
    optout_invitation_date: z.date(),
    optout_activation_scheduled_date: z.date(),
    optout_activation_date: z.date(),
    optout_refusal_date: z.date(),
    mailing: z.array(ZMailing),
    last_catalogue_sync_date: z.date(),
    created_at: z.date(),
    affelnet_perimetre: z.boolean(),
    to_etablissement_emails: z.array(ZMailing),
  })
  .strict()

export type IEtablissement = z.output<typeof ZEtablissement>
export type IEtablissementJson = Jsonify<z.input<typeof ZEtablissement>>
