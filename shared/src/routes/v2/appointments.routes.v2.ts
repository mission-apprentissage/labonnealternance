import { ReferrerApiEnum } from "../../constants/referers.js"
import { extensions } from "../../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../../helpers/zodWithOpenApi.js"
import { IRoutesDef } from "../common.routes.js"

const ZAppointmentContextParcoursup = z
  .object({
    parcoursup_id: z.string(),
  })
  .strict()

export type IAppointmentContextParcoursup = z.output<typeof ZAppointmentContextParcoursup>

const ZAppointmentContextOnisep = z
  .object({
    onisep_id: z.string().describe("Identifiant ONISEP utilisé avec le mapping de la collection referentielonisep"),
  })
  .strict()

export type IAppointmentContextOnisep = z.output<typeof ZAppointmentContextOnisep>

const ZAppointmentContextCleMinistereEducatif = z
  .object({
    cle_ministere_educatif: z.string(),
  })
  .strict()

export type IAppointmentContextCleMinistereEducatif = z.output<typeof ZAppointmentContextCleMinistereEducatif>

const ZAppointmentContextApi = z.union([
  // Find through "idParcoursup"
  ZAppointmentContextParcoursup,
  // Find through "idActionFormation"
  ZAppointmentContextOnisep,
  // Find through "idCleMinistereEducatif"
  ZAppointmentContextCleMinistereEducatif,
])

const ZAppointmentContextApiWithReferrer = z.intersection(ZAppointmentContextApi, z.object({ referrer: extensions.buildEnum(ReferrerApiEnum) }))
export type IAppointmentContextAPI = z.output<typeof ZAppointmentContextApiWithReferrer>

export const ZAppointmentResponseAvailable = z
  .object({
    etablissement_formateur_entreprise_raison_sociale: z.string().nullable().describe("Raison social de l'établissement formateur"),
    intitule_long: z.string().describe("Intitulé long de la formation"),
    lieu_formation_adresse: z.string().describe("Adresse du lieu de formation"),
    code_postal: z.string().describe("Code postal du lieu de formation"),
    etablissement_formateur_siret: extensions.siret.nullable().describe("Numéro SIRET de l'établissement formateur"),
    cfd: z.string().describe("Code formation diplôme de la formation"),
    localite: z.string().describe("Localité du lieu de formation"),
    cle_ministere_educatif: z.string().describe("Identifiant unique de la formation au sein du ministère de l'éducation"),
    form_url: z.string().describe("Lien de prise de rendez-vous La bonne alternance"),
  })
  .strict()
export type IAppointMentResponseAvailable = z.output<typeof ZAppointmentResponseAvailable>

const ZAppointmentResponseUnavailable = z.object({
  error: z.literal("Appointment request not available"),
})

const ZAppointmentResponseSchema = z.union([ZAppointmentResponseAvailable, ZAppointmentResponseUnavailable])
export type IAppointmentResponseSchema = z.output<typeof ZAppointmentResponseSchema>

export const zAppointmentsRouteV2 = {
  post: {
    "/v2/appointment": {
      method: "post",
      path: "/v2/appointment",
      body: ZAppointmentContextApi,
      response: {
        "200": ZAppointmentResponseSchema,
      },
      securityScheme: { auth: "api-apprentissage", access: "api-apprentissage:appointment", resources: {} },
      openapi: {
        tags: ["V2 - Appointment"] as string[],
      },
    },
  },
} as const satisfies IRoutesDef
