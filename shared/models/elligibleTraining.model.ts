import { Jsonify } from "type-fest"

import { z } from "../helpers/zodWithOpenApi"

import { ZAppointment } from "./appointments.model"
import { zObjectId } from "./common"
import { ZEtablissement } from "./etablissement.model"

export const ZEligibleTrainingsForAppointmentSchema = z
  .object({
    _id: zObjectId,
    training_id_catalogue: z.string(),
    training_intitule_long: z.string(),
    etablissement_formateur_zip_code: ZEtablissement.shape.formateur_zip_code,
    training_code_formation_diplome: z.string(),
    lieu_formation_email: z.string().nullable(),
    is_lieu_formation_email_customized: z.boolean().nullable(),
    referrers: z.array(z.string()).default([]),
    rco_formation_id: z.string().nullable(),
    is_catalogue_published: z.boolean(),
    last_catalogue_sync_date: z.date().default(() => new Date()),
    parcoursup_id: z.string().nullable(),
    cle_ministere_educatif: ZAppointment.shape.cle_ministere_educatif,
    etablissement_formateur_raison_sociale: z.string(),
    etablissement_formateur_street: z.string(),
    departement_etablissement_formateur: z.string(),
    etablissement_formateur_city: ZEtablissement.shape.formateur_city,
    lieu_formation_street: z.string(),
    lieu_formation_city: z.string(),
    lieu_formation_zip_code: z.string(),
    etablissement_formateur_siret: ZEtablissement.shape.formateur_siret,
    etablissement_gestionnaire_siret: ZEtablissement.shape.gestionnaire_siret,
    created_at: z.date().default(() => new Date()),
    historization_date: z.date().nullish(),
  })
  .strict()
  .openapi("EligibleTrainingsForAppointment")

export type IEligibleTrainingsForAppointment = z.output<typeof ZEligibleTrainingsForAppointmentSchema>
export type IEligibleTrainingsForAppointmentJson = Jsonify<z.input<typeof ZEligibleTrainingsForAppointmentSchema>>
