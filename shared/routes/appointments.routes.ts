import { z } from "zod"

import { referrers } from "../constants/referers"
import { ZAppointment } from "../models"
import { ZEligibleTrainingsForAppointmentSchema } from "../models/elligibleTraining.model"

const zContextCreateSchema = z.union([
  // Find through "idParcoursup"
  z
    .object({
      idParcoursup: z.string().min(1),
      idRcoFormation: z.string().optional(),
      idActionFormation: z.string().optional(),
      idCleMinistereEducatif: z.string().optional(),
      trainingHasJob: z.boolean().optional(),
      referrer: z.enum([
        referrers.PARCOURSUP.name.toLowerCase(),
        referrers.LBA.name.toLowerCase(),
        referrers.PFR_PAYS_DE_LA_LOIRE.name.toLowerCase(),
        referrers.ONISEP.name.toLowerCase(),
        referrers.JEUNE_1_SOLUTION.name.toLowerCase(),
        referrers.AFFELNET.name.toLowerCase(),
      ]),
    })
    .strict(),

  // Find through "idRcoFormation"
  z
    .object({
      idRcoFormation: z.string().min(1),
      idActionFormation: z.string().optional(),
      idParcoursup: z.string().optional(),
      idCleMinistereEducatif: z.string().optional(),
      trainingHasJob: z.boolean().optional(),
      referrer: z.enum([
        referrers.PARCOURSUP.name.toLowerCase(),
        referrers.LBA.name.toLowerCase(),
        referrers.PFR_PAYS_DE_LA_LOIRE.name.toLowerCase(),
        referrers.ONISEP.name.toLowerCase(),
        referrers.JEUNE_1_SOLUTION.name.toLowerCase(),
        referrers.AFFELNET.name.toLowerCase(),
      ]),
    })
    .strict(),

  // Find through "idActionFormation"
  z
    .object({
      idActionFormation: z.string().min(1),
      idRcoFormation: z.string().optional(),
      idParcoursup: z.string().optional(),
      idCleMinistereEducatif: z.string().optional(),
      trainingHasJob: z.boolean().optional(),
      referrer: z.enum([
        referrers.PARCOURSUP.name.toLowerCase(),
        referrers.LBA.name.toLowerCase(),
        referrers.PFR_PAYS_DE_LA_LOIRE.name.toLowerCase(),
        referrers.ONISEP.name.toLowerCase(),
        referrers.JEUNE_1_SOLUTION.name.toLowerCase(),
        referrers.AFFELNET.name.toLowerCase(),
      ]),
    })
    .strict(),

  // Find through "idCleMinistereEducatif"
  z
    .object({
      idCleMinistereEducatif: z.string().min(1),
      idRcoFormation: z.string().optional(),
      idActionFormation: z.string().optional(),
      idParcoursup: z.string().optional(),
      trainingHasJob: z.boolean().optional(),
      referrer: z.enum([
        referrers.PARCOURSUP.name.toLowerCase(),
        referrers.LBA.name.toLowerCase(),
        referrers.PFR_PAYS_DE_LA_LOIRE.name.toLowerCase(),
        referrers.ONISEP.name.toLowerCase(),
        referrers.JEUNE_1_SOLUTION.name.toLowerCase(),
        referrers.AFFELNET.name.toLowerCase(),
      ]),
    })
    .strict(),
])

export const zAppointmentsRoute = {
  get: {
    "/api/appointment-request/context/recap": {
      queryString: z.object({ appointmentId: z.string() }).strict(),
      response: {
        "2xx": z
          .object({
            appointment: z.object({
              appointment: z.any(),
              appointment_origin_detailed: z.string(),
            }),
            user: z.any(),
            etablissement: ZEligibleTrainingsForAppointmentSchema,
          })
          .strict(),
      },
    },
  },
  post: {
    "/api/appointment-request/context/create": {
      body: zContextCreateSchema,
      response: {
        "2xx": z.object({
          etablissement_formateur_entreprise_raison_sociale: z.string(),
          intitule_long: z.string(),
          lieu_formation_adresse: z.string(),
          code_postal: z.string(),
          etablissement_formateur_siret: z.string(),
          cfd: z.string(),
          localite: z.string(),
          id_rco_formation: z.string(),
          cle_ministere_educatif: z.string(),
          form_url: z.string(),
        }),
      },
    },
    "/api/appointment-request/validate": {
      body: z
        .object({
          firstname: z.string(),
          lastname: z.string(),
          phone: z.string(),
          email: z.string(),
          type: z.string(),
          applicantMessageToCfa: z.string().nullable(),
          applicantReasons: z.enum(["modalite", "contenu", "porte", "frais", "place", "horaire", "plus", "accompagnement", "lieu", "suivi", "autre"]),
          cleMinistereEducatif: z.string(),
          appointmentOrigin: z.string(),
        })
        .strict(),
      response: {
        "2xx": z
          .object({
            userId: z.string(),
            appointment: ZAppointment,
          })
          .strict(),
      },
    },
    "/api/appointment-request/reply": {
      body: z
        .object({
          appointment_id: z.string(),
          cfa_intention_to_applicant: z.string(),
          cfa_message_to_applicant_date: z.date(),
          cfa_message_to_applicant: z.string().nullable(),
        })
        .strict(),
      response: {
        "2xx": z
          .object({
            appointment_id: z.string(),
            cfa_intention_to_applicant: z.string(),
            cfa_message_to_applicant: z.string(),
            cfa_message_to_applicant_date: z.date(),
          })
          .strict(),
      },
    },
  },
}
