import type { Jsonify } from "type-fest"
import { referrers } from "../constants/referers.js"
import { extensions } from "../helpers/zod-helpers/zod-primitives.js"
import { z } from "../helpers/zod-with-open-api.js"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"
import { ZEtablissement } from "./etablissement.model.js"

const collectionName = "eligible_trainings_for_appointments" as const

export const ZReferrerName = z.enum(Object.keys(referrers) as [keyof typeof referrers, ...(keyof typeof referrers)[]])
export type IReferrerName = z.output<typeof ZReferrerName>

export const ZEligibleTrainingsForAppointmentSchema = z.strictObject({
  _id: zObjectId,
  training_id_catalogue: z.string(),
  training_intitule_long: z.string(),
  etablissement_formateur_zip_code: ZEtablissement.shape.formateur_zip_code,
  training_code_formation_diplome: z.string(),
  lieu_formation_email: z.string().nullable(),
  is_lieu_formation_email_customized: z.boolean().nullish(),
  referrers: z.array(z.string()).default([]),
  // Forçages manuels de l'admin RDVA : la diffusion effective vaut (automatique ∪ forced_on) ∖ forced_off, cf. applyReferrerOverrides
  referrers_forced_on: z.array(ZReferrerName).nullish(),
  referrers_forced_off: z.array(ZReferrerName).nullish(),
  rco_formation_id: z.string().nullable(),
  is_catalogue_published: z.boolean(),
  last_catalogue_sync_date: z.date().default(() => new Date()),
  parcoursup_id: z.string().nullable(),
  parcoursup_visible: z.boolean().nullish(),
  affelnet_visible: z.boolean().nullish(),
  cle_ministere_educatif: z.string(),
  etablissement_formateur_raison_sociale: z.string(),
  etablissement_formateur_street: z.string().nullable(),
  departement_etablissement_formateur: z.string().nullable(),
  etablissement_formateur_city: z.string().nullish(),
  lieu_formation_street: z.string(),
  lieu_formation_city: z.string(),
  lieu_formation_zip_code: z.string(),
  etablissement_formateur_siret: extensions.siret.nullish(),
  etablissement_gestionnaire_siret: extensions.siret.nullish(),
  created_at: z.date().default(() => new Date()),
  historization_date: z.date().nullish(),
})

export type IEligibleTrainingsForAppointment = z.output<typeof ZEligibleTrainingsForAppointmentSchema>
export type IEligibleTrainingsForAppointmentJson = Jsonify<z.input<typeof ZEligibleTrainingsForAppointmentSchema>>

// Vue admin : diffusion automatique (opt-out, premium) et plateformes éligibles, calculées à la lecture
export const ZETFAAdminParameter = ZEligibleTrainingsForAppointmentSchema.extend({
  referrers_auto: z.array(ZReferrerName),
  referrers_eligible: z.array(ZReferrerName),
})
export type IETFAAdminParameterJson = Jsonify<z.input<typeof ZETFAAdminParameter>>

export const ZETFAParameters = z.object({ parameters: z.array(ZETFAAdminParameter) })
export type IETFAParametersJson = Jsonify<z.output<typeof ZETFAParameters>>

export default {
  zod: ZEligibleTrainingsForAppointmentSchema,
  indexes: [
    [{ cle_ministere_educatif: 1 }, {}],
    [{ parcoursup_id: 1 }, {}],
    [{ parcoursup_visible: 1 }, {}],
    [{ affelnet_visible: 1 }, {}],
    [{ referrers: 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor
