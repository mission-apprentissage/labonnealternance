import { referrers } from "../constants/referers"
import { z } from "../helpers/zodWithOpenApi"
import { ZEtablissement } from "../models"

import { IRoutesDef } from "./common.routes"

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
export type IAppointmentRequestContextCreateFormAvailableResponseSchema = z.output<typeof zAppointmentRequestContextCreateFormAvailableResponseSchema>
export type IAppointmentRequestContextCreateFormUnavailableResponseSchema = z.output<typeof zAppointmentRequestContextCreateFormUnavailableResponseSchema>

export const zAppointmentsRouteV2 = {
  post: {
    "/appointment": {
      method: "post",
      path: "/appointment",
      body: zContextCreateSchema,
      response: {
        "200": zAppointmentRequestContextCreateResponseSchema,
      },
      securityScheme: { auth: "api-key", access: null, resources: {} },
      openapi: {
        tags: ["V2 - Appointment Request"] as string[],
        operationId: "appointmentCreateContext",
        description: "Appointment request",
      },
    },
  },
  get: {
    "/appointment/:cle_ministere_educatif/context": {
      method: "get",
      path: "/appointment/:cle_ministere_educatif/context",
      params: z
        .object({
          cle_ministere_educatif: z.string().openapi({
            param: {
              description: "the id of the lba  job looked for.",
            },
          }),
        })
        .strict(),
      querystring: z
        .object({
          referrer: z.string(),
        })
        .strict(),
      response: {
        "200": zAppointmentRequestContextCreateResponseSchema,
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
