import { Jsonify } from "type-fest"
import { zObjectId } from "zod-mongodb-schema"

import { referrers } from "../constants/referers.js"
import { z } from "../helpers/zodWithOpenApi.js"
import { EREASONS, ZAppointment } from "../models/appointments.model.js"
import { ZEtablissement } from "../models/etablissement.model.js"
import { ZUser } from "../models/user.model.js"

import { IRoutesDef } from "./common.routes.js"

const zContextCreateSchemaParcoursup = z
  .object({
    idParcoursup: z.string(),
    trainingHasJob: z.boolean().optional(),
    referrer: z.literal(referrers.PARCOURSUP.name.toLowerCase()),
  })
  .strict()

export type IContextCreateSchemaParcoursup = z.output<typeof zContextCreateSchemaParcoursup>

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

  // Find through "idActionFormation"
  zContextCreateSchemaActionFormation,

  // Find through "idCleMinistereEducatif"
  zContextCreateSchemaCleMinistereEducatif,
])

const zAppointmentRequestContextCreateFormAvailableResponseSchema = z
  .object({
    etablissement_formateur_entreprise_raison_sociale: ZEtablissement.shape.raison_sociale,
    intitule_long: z.string().openapi({
      example: "METIERS D'ART ET DU DESIGN (DN)",
    }),
    lieu_formation_adresse: z.string().openapi({
      example: "80 Rue Jules Ferry",
    }),
    code_postal: z.string().openapi({
      example: "93170",
    }),
    etablissement_formateur_siret: ZEtablissement.shape.formateur_siret,
    cfd: z.string().openapi({
      example: "24113401",
    }),
    localite: z.string().openapi({ example: "Bagnolet" }),
    id_rco_formation: z
      .string()
      .openapi({
        example: "14_AF_0000095539|14_SE_0000501120##14_SE_0000598458##14_SE_0000642556##14_SE_0000642557##14_SE_0000825379##14_SE_0000825382|101249",
      })
      .nullable(),
    cle_ministere_educatif: z.string().openapi({
      example: "101249P01313538697790003635386977900036-93006#L01",
    }),
    form_url: z.string().openapi({
      example: "https://labonnealternance.apprentissage.beta.gouv.fr/espace-pro/form?referrer=affelnet&cleMinistereEducatif=101249P01313538697790003635386977900036-93006%23L01",
    }),
  })
  .strict()

const zAppointmentRequestContextCreateFormUnavailableResponseSchema = z
  .object({
    error: z.literal("Prise de rendez-vous non disponible."),
  })
  .strict()

const zAppointmentRequestContextCreateResponseSchema = z.union([
  zAppointmentRequestContextCreateFormAvailableResponseSchema,
  zAppointmentRequestContextCreateFormUnavailableResponseSchema,
])

export type IAppointmentRequestContextCreateResponseSchema = z.output<typeof zAppointmentRequestContextCreateResponseSchema>
export type IAppointmentRequestContextCreateFormAvailableResponseSchema = Jsonify<z.output<typeof zAppointmentRequestContextCreateFormAvailableResponseSchema>>
export type IAppointmentRequestContextCreateFormUnavailableResponseSchema = Jsonify<z.output<typeof zAppointmentRequestContextCreateFormUnavailableResponseSchema>>

const zContextQuerySchema = z
  .object({
    idCleMinistereEducatif: z.string().optional(),
    idActionFormation: z.string().optional(),
    idParcoursup: z.string().optional(),
    referrer: z.enum([
      referrers.PARCOURSUP.name.toLowerCase(),
      referrers.LBA.name.toLowerCase(),
      referrers.ONISEP.name.toLowerCase(),
      referrers.JEUNE_1_SOLUTION.name.toLowerCase(),
      referrers.AFFELNET.name.toLowerCase(),
    ]),
  })
  .strict()

export const zAppointmentsRoute = {
  get: {
    "/appointment": {
      method: "get",
      path: "/appointment",
      querystring: zContextQuerySchema,
      response: {
        "200": zAppointmentRequestContextCreateResponseSchema,
      },
      securityScheme: null,
    },
    "/appointment-request/context/short-recap": {
      method: "get",
      path: "/appointment-request/context/short-recap",
      querystring: z.object({ appointmentId: z.string() }).strict(),
      response: {
        "200": z
          .object({
            user: z
              .object({
                firstname: z.string(),
                lastname: z.string(),
                phone: z.string(),
                email: z.string(),
              })
              .strict(),
            formation: z
              .object({
                etablissement_formateur_raison_sociale: z.string().nullish(),
                lieu_formation_email: z.string().nullish(),
              })
              .strict(),
          })
          .strict(),
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        resources: {},
      },
    },
    "/appointment-request/context/recap": {
      method: "get",
      path: "/appointment-request/context/recap",
      querystring: z.object({ appointmentId: z.string() }).strict(),
      response: {
        "200": z
          .object({
            appointment: z
              .object({
                _id: ZAppointment.shape._id,
                cfa_intention_to_applicant: ZAppointment.shape.cfa_intention_to_applicant,
                cfa_message_to_applicant_date: ZAppointment.shape.cfa_message_to_applicant_date,
                cfa_message_to_applicant: ZAppointment.shape.cfa_message_to_applicant,
                applicant_message_to_cfa: ZAppointment.shape.applicant_message_to_cfa,
                applicant_reasons: ZAppointment.shape.applicant_reasons,
                cle_ministere_educatif: ZAppointment.shape.cle_ministere_educatif,
                applicant_id: ZAppointment.shape.applicant_id,
                cfa_read_appointment_details_date: ZAppointment.shape.cfa_read_appointment_details_date,
              })
              .strict(),
            user: z
              .object({
                _id: zObjectId,
                firstname: z.string(),
                lastname: z.string(),
                phone: z.string(),
                email: z.string(),
                type: z.string(),
              })
              .strict(),
            formation: z.union([
              z
                .object({
                  _id: ZEtablissement.shape._id,
                  training_intitule_long: z.string().nullish(),
                  etablissement_formateur_raison_sociale: z.string().nullish(),
                  lieu_formation_street: z.string().nullish(),
                  lieu_formation_city: z.string().nullish(),
                  lieu_formation_zip_code: z.string().nullish(),
                  lieu_formation_email: z.string().nullish(),
                })
                .strict(),
              z.null(),
            ]),
          })
          .strict(),
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        resources: {},
      },
    },
  },
  post: {
    "/appointment-request/context/create": {
      method: "post",
      path: "/appointment-request/context/create",
      body: zContextCreateSchema,
      response: {
        "200": zAppointmentRequestContextCreateResponseSchema,
      },
      securityScheme: null,
      openapi: {
        tags: ["V1 - Appointment Request"] as string[],
        description: "Appointment request",
      },
    },
    "/appointment-request/validate": {
      method: "post",
      path: "/appointment-request/validate",
      body: ZUser.pick({
        firstname: true,
        lastname: true,
        phone: true,
        email: true,
        type: true,
      })
        .extend({
          applicantMessageToCfa: z.string().nullable(),
          applicantReasons: z.array(z.enum([EREASONS[0], ...EREASONS.slice(1)])),
          cleMinistereEducatif: z.string(),
          appointmentOrigin: z.string(),
        })
        .strict(),
      response: {
        "200": z
          .object({
            userId: zObjectId,
            appointment: z.union([ZAppointment, z.null()]),
            token: z.string(),
          })
          .strict(),
      },
      securityScheme: null,
    },
    "/appointment-request/reply": {
      method: "post",
      path: "/appointment-request/reply",
      body: z
        .object({
          appointment_id: zObjectId,
          cfa_intention_to_applicant: z.string(),
          cfa_message_to_applicant: z.string().nullable(),
        })
        .strict(),
      response: {
        "200": z
          .object({
            appointment_id: z.string(),
            cfa_intention_to_applicant: z.string(),
            cfa_message_to_applicant: z.string().nullable(),
            cfa_message_to_applicant_date: z.string(),
          })
          .strict(),
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        resources: {},
      },
    },
  },
} as const satisfies IRoutesDef
