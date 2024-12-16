import { ZodError, ZodSchema } from "zod"

import { referrers } from "../constants/referers"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { IRoutesDef } from "./common.routes"

const ZAppointmentContextParcoursup = z
  .object({
    parcoursup_id: z.string(),
    referrer: z.literal(referrers.PARCOURSUP.name.toLowerCase()),
  })
  .strict()
export type IAppointmentContextParcoursup = z.output<typeof ZAppointmentContextParcoursup>

const ZAppointmentContextOnisep = z
  .object({
    onisep_id: z.string().describe("Identifiant ONISEP utilisé avec le mapping de la collection referentielonisep"),
    referrer: z.literal(referrers.ONISEP.name.toLowerCase()),
  })
  .strict()
export type IAppointmentContextOnisep = z.output<typeof ZAppointmentContextOnisep>

const ZAppointmentContextCleMinistereEducatif = z
  .object({
    cle_ministere_educatif: z.string(),
    referrer: z.enum([
      referrers.PARCOURSUP.name.toLowerCase(),
      referrers.LBA.name.toLowerCase(),
      referrers.ONISEP.name.toLowerCase(),
      referrers.JEUNE_1_SOLUTION.name.toLowerCase(),
      referrers.AFFELNET.name.toLowerCase(),
    ]),
  })
  .strict()
export type IAppointmentContextCleMinistereEducatif = z.output<typeof ZAppointmentContextCleMinistereEducatif>

const ZAppointmentResponseAvailable = z
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

const ZAppointmentResponseUnavailable = z.object({
  error: z.literal("Appointment request not available"),
})

const ZAppointmentResponseSchema = z.union([ZAppointmentResponseAvailable, ZAppointmentResponseUnavailable])
export type IAppointmentResponseSchema = z.output<typeof ZAppointmentResponseSchema>

const schemas: ZodSchema[] = [ZAppointmentContextParcoursup, ZAppointmentContextOnisep, ZAppointmentContextCleMinistereEducatif]

export const zAppointmentsRouteV2 = {
  post: {
    "/appointment": {
      method: "post",
      path: "/appointment",
      // KBA 20241216 : union validation throw all schema errors. In order to have specific error based on the input, refine is used
      body: z.any().superRefine((data, ctx) => {
        let matchedSchema: ZodSchema | null = null
        let highestScore = -1
        let bestMatchError: ZodError | null = null
        const hasRelevantKeys = ["parcoursup_id", "onisep_id", "cle_ministere_educatif"].some((key) => key in data)

        if (!hasRelevantKeys || !data) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid input: either parcoursup_id, onisep_id or cle_minister_educatif is expected along with the referrer",
          })
          return
        }

        for (const schema of schemas) {
          const result = schema.safeParse(data)
          if (result.success) {
            matchedSchema = schema
            break
          } else {
            // @ts-expect-error
            const schemaKeys = Object.keys(schema._def.shape())
            const dataKeys = Object.keys(data)
            const score = schemaKeys.reduce((acc, key) => acc + (dataKeys.includes(key) ? 1 : 0), 0)

            if (score > highestScore) {
              highestScore = score
              bestMatchError = result.error
            }
          }
        }

        if (!matchedSchema && bestMatchError) {
          // Add issues from the best matching schema
          for (const issue of bestMatchError.issues) {
            ctx.addIssue(issue)
          }
        }
      }),
      response: {
        "200": ZAppointmentResponseSchema,
      },
      securityScheme: { auth: "api-apprentissage", access: "api-apprentissage:appointment", resources: {} },
    },
  },
} as const satisfies IRoutesDef
