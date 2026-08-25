import type { Jsonify } from "type-fest"
import { referrers } from "../constants/referers.js"
import { z } from "../helpers/zod-with-open-api.js"
import { EREASONS, ZAppointment, ZAppointmentRecap, ZAppointmentShortRecap } from "../models/appointments.model.js"
import { zObjectId } from "../models/common.js"
import { ZEtablissement } from "../models/etablissement.model.js"
import { ZUser } from "../models/user.model.js"

import type { IRoutesDef } from "./common.routes.js"
import { ZAppointmentResponseAvailable } from "./v2/appointments.routes.v2.js"

const zContextCreateSchemaParcoursup = z.strictObject({
  idParcoursup: z.string(),
  trainingHasJob: z.boolean().optional(),
  referrer: z.literal(referrers.PARCOURSUP.name.toLowerCase()),
})

export type IContextCreateSchemaParcoursup = z.output<typeof zContextCreateSchemaParcoursup>

const zContextCreateSchemaActionFormation = z.strictObject({
  idActionFormation: z.string().min(1),
  trainingHasJob: z.boolean().optional(),
  referrer: z.literal(referrers.ONISEP.name.toLowerCase()),
})

export type IContextCreateSchemaActionFormation = z.output<typeof zContextCreateSchemaActionFormation>

const zContextCreateSchemaCleMinistereEducatif = z.strictObject({
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

export type IContextCreateSchemaCleMinistereEducatif = z.output<typeof zContextCreateSchemaCleMinistereEducatif>

const zContextCreateSchema = z.union([
  // Find through "idParcoursup"
  zContextCreateSchemaParcoursup,

  // Find through "idActionFormation"
  zContextCreateSchemaActionFormation,

  // Find through "idCleMinistereEducatif"
  zContextCreateSchemaCleMinistereEducatif,
])

const zAppointmentRequestContextCreateFormAvailableResponseSchema = z.strictObject({
  etablissement_formateur_entreprise_raison_sociale: ZEtablissement.shape.raison_sociale,
  intitule_long: z.string().nullable(),
  lieu_formation_adresse: z.string(),
  code_postal: z.string(),
  etablissement_formateur_siret: ZEtablissement.shape.formateur_siret,
  cfd: z.string(),
  localite: z.string(),
  id_rco_formation: z
    .string()

    .nullable(),
  cle_ministere_educatif: z.string(),
  form_url: z.string(),
})

const zAppointmentRequestContextCreateFormUnavailableResponseSchema = z.strictObject({
  error: z.literal("Prise de rendez-vous non disponible."),
})

const zAppointmentRequestContextCreateResponseSchema = z.union([
  zAppointmentRequestContextCreateFormAvailableResponseSchema,
  zAppointmentRequestContextCreateFormUnavailableResponseSchema,
])

export type IAppointmentRequestContextCreateResponseSchema = z.output<typeof zAppointmentRequestContextCreateResponseSchema>
export type IAppointmentRequestContextCreateFormAvailableResponseSchema = Jsonify<z.output<typeof zAppointmentRequestContextCreateFormAvailableResponseSchema>>
export type IAppointmentRequestContextCreateFormUnavailableResponseSchema = Jsonify<z.output<typeof zAppointmentRequestContextCreateFormUnavailableResponseSchema>>

// const zContextQuerySchema = z
//   .object({
//     idCleMinistereEducatif: z.string().optional(),
//     idActionFormation: z.string().optional(),
//     idParcoursup: z.string().optional(),
//     referrer: z.enum([
//       referrers.PARCOURSUP.name.toLowerCase(),
//       referrers.LBA.name.toLowerCase(),
//       referrers.ONISEP.name.toLowerCase(),
//       referrers.JEUNE_1_SOLUTION.name.toLowerCase(),
//       referrers.AFFELNET.name.toLowerCase(),
//     ]),
//   })
//   .strict()

export const zAppointmentsRoute = {
  get: {
    "/_private/appointment": {
      method: "get",
      path: "/_private/appointment",
      querystring: z.object({ cleMinistereEducatif: z.string(), referrer: z.string() }),
      response: {
        "200": ZAppointmentResponseAvailable,
      },
      securityScheme: null,
    },
    "/appointment-request/context/short-recap": {
      method: "get",
      path: "/appointment-request/context/short-recap",
      querystring: z.strictObject({ appointmentId: z.string() }),
      response: {
        "200": ZAppointmentShortRecap,
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
      querystring: z.strictObject({ appointmentId: z.string() }),
      response: {
        "200": ZAppointmentRecap,
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
        "200": z.strictObject({
          userId: zObjectId,
          appointment: z.union([ZAppointment, z.null()]),
          token: z.string(),
        }),
      },
      securityScheme: null,
    },
    "/appointment-request/reply": {
      method: "post",
      path: "/appointment-request/reply",
      body: z.strictObject({
        appointment_id: zObjectId,
        cfa_intention_to_applicant: z.string(),
        cfa_message_to_applicant: z.string().nullable(),
      }),
      response: {
        "200": z.strictObject({
          appointment_id: z.string(),
          cfa_intention_to_applicant: z.string(),
          cfa_message_to_applicant: z.string().nullable(),
          cfa_message_to_applicant_date: z.string(),
        }),
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        resources: {},
      },
    },
  },
} as const satisfies IRoutesDef
