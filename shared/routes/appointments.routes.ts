import { z } from "zod"

import { referrers } from "../constants/referers"
import { ZAppointment } from "../models"
import { ZEligibleTrainingsForAppointmentSchema } from "../models/elligibleTraining.model"

import { IRoutesDef, ZResError } from "./common.routes"

const zContextCreateSchemaParcoursup = z
  .object({
    idParcoursup: z.string(),
    trainingHasJob: z.boolean().optional(),
    referrer: z.literal(referrers.PARCOURSUP.name.toLowerCase()),
  })
  .strict()

export type IContextCreateSchemaParcoursup = z.output<typeof zContextCreateSchemaParcoursup>

const zContextCreateSchemaRcoFormation = z
  .object({
    idRcoFormation: z.string().min(1),
    trainingHasJob: z.boolean().optional(),
    referrer: z.literal(referrers.PFR_PAYS_DE_LA_LOIRE.name.toLowerCase()),
  })
  .strict()

export type IContextCreateSchemaRcoFormation = z.output<typeof zContextCreateSchemaRcoFormation>

const zContextCreateSchemaActionFormation = z
  .object({
    idActionFormation: z.string().min(1),
    trainingHasJob: z.boolean().optional(),
    referrer: z.literal(referrers.ONISEP.name.toLowerCase()),
  })
  .strict()

export type IContextCreateSchemaActionFormation = z.output<typeof zContextCreateSchemaActionFormation>

const zContextCreateSchemaCleMinistereEducatif = z
  .object({
    idCleMinistereEducatif: z.string().min(1),
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
  .strict()

export type IContextCreateSchemaCleMinistereEducatif = z.output<typeof zContextCreateSchemaCleMinistereEducatif>

const zContextCreateSchema = z.union([
  // Find through "idParcoursup"
  zContextCreateSchemaParcoursup,

  // Find through "idRcoFormation"
  zContextCreateSchemaRcoFormation,

  // Find through "idActionFormation"
  zContextCreateSchemaActionFormation,

  // Find through "idCleMinistereEducatif"
  zContextCreateSchemaCleMinistereEducatif,
])

export const zAppointmentsRoute = {
  get: {
    "/api/admin/appointments": {
      querystring: z.object({ query: z.string(), limit: z.coerce.number(), page: z.coerce.number() }).strict(),
      response: {
        "2xx": z.object({
          appointments: z.array(ZAppointment),
          pagination: z.object({
            page: z.number(),
            resultats_par_page: z.number(),
            nombre_de_page: z.number(),
            total: z.number(),
          }),
        }),
      },
      securityScheme: {
        auth: "jwt-rdv-admin",
        role: "admin",
      },
    },
    "/api/admin/appointments/details": {
      querystring: z.object({ query: z.string(), limit: z.coerce.number(), page: z.coerce.number() }).strict(),
      response: {
        "2xx": z.object({
          appointments: z.array(ZAppointment),
          pagination: z.object({
            page: z.number(),
            resultats_par_page: z.number(),
            nombre_de_page: z.number(),
            total: z.number(),
          }),
        }),
      },
      securityScheme: {
        auth: "jwt-rdv-admin",
        role: "admin",
      },
    },
    "/api/appointment-request/context/recap": {
      querystring: z.object({ appointmentId: z.string() }).strict(),
      response: {
        "2xx": z
          .object({
            appointment: z.object({
              appointment: z.any(),
              appointment_origin_detailed: z.string(),
            }),
            user: z.any(),
            etablissement: z.union([ZEligibleTrainingsForAppointmentSchema, z.object({}).strict()]),
          })
          .strict(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
  post: {
    "/api/appointment-request/context/create": {
      body: zContextCreateSchema,
      response: {
        "2xx": z.union([
          z.object({
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
          z
            .object({
              error: z.literal("Prise de rendez-vous non disponible."),
            })
            .strict(),
        ]),
        "404": z.union([ZResError, z.literal("Formation introuvable")]),
        "400": z.union([ZResError, z.literal("Critère de recherche non conforme.")]),
      },
      securityScheme: {
        auth: "none",
        role: "all",
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
          applicantReasons: z.array(z.enum(["modalite", "contenu", "porte", "frais", "place", "horaire", "plus", "accompagnement", "lieu", "suivi", "autre"])),
          cleMinistereEducatif: z.string(),
          appointmentOrigin: z.string(),
        })
        .strict(),
      response: {
        "2xx": z
          .object({
            userId: z.string(),
            appointment: z.union([ZAppointment, z.null()]),
          })
          .strict(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
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
            cfa_message_to_applicant: z.string().nullable(),
            cfa_message_to_applicant_date: z.date(),
          })
          .strict(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
} as const satisfies IRoutesDef
