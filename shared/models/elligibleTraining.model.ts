import { Jsonify } from "type-fest"
import { z } from "zod"

import { zObjectId } from "./common"

export const ZEligibleTrainingsForAppointmentSchema = z
  .object({
    _id: zObjectId,
    training_id_catalogue: z.string().nullable(),
    training_intitule_long: z.string().nullable(),
    etablissement_formateur_zip_code: z.string().nullable(),
    training_code_formation_diplome: z.string().nullable(),
    lieu_formation_email: z.string().nullable(),
    is_lieu_formation_email_customized: z.boolean().nullable(),
    referrers: z.array(z.string()).default([]),
    rco_formation_id: z.string().nullable(),
    is_catalogue_published: z.boolean().nullable(),
    last_catalogue_sync_date: z.date().default(() => new Date()),
    parcoursup_id: z.string().nullable(),
    cle_ministere_educatif: z.string().nullable(),
    etablissement_formateur_raison_sociale: z.string().nullable(),
    etablissement_formateur_street: z.string().nullable(),
    departement_etablissement_formateur: z.string().nullable(),
    etablissement_formateur_city: z.string().nullable(),
    lieu_formation_street: z.string().nullable(),
    lieu_formation_city: z.string().nullable(),
    lieu_formation_zip_code: z.string().nullable(),
    etablissement_formateur_siret: z.string().nullable(),
    etablissement_gestionnaire_siret: z.string().nullable(),
    created_at: z.date().default(() => new Date()),
    historization_date: z.date().nullable(),
  })
  .strict()

export type IEligibleTrainingsForAppointmentSchema = z.output<typeof ZEligibleTrainingsForAppointmentSchema>
export type IEligibleTrainingsForAppointmentJson = Jsonify<z.input<typeof ZEligibleTrainingsForAppointmentSchema>>
