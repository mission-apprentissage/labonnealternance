import { z } from "../helpers/zodWithOpenApi"
import { ZApplication } from "../models/applications.model"
import { rateLimitDescription } from "../utils/rateLimitDescription"

import { IRoutesDef } from "./common.routes"

const ZNewApplicationV2NEWCompanySiret = ZApplication.pick({
  applicant_first_name: true,
  applicant_last_name: true,
  applicant_email: true,
  applicant_phone: true,
  company_siret: true,
})
  .extend({
    message: ZApplication.shape.applicant_message_to_company.optional(),
    applicant_file_name: ZApplication.shape.applicant_attachment_name,
    applicant_file_content: z.string().max(4215276).openapi({
      description: "Le contenu du fichier du CV du candidat. La taille maximale autorisée est de 3 Mo.",
      example: "data:application/pdf;base64,JVBERi0xLjQKJ...",
    }),
  })
  .openapi("V2 - Application")

const ZNewApplicationV2NEWJobId = ZApplication.pick({ applicant_first_name: true, applicant_last_name: true, applicant_email: true, applicant_phone: true })
  .extend({
    message: ZApplication.shape.applicant_message_to_company.optional(),
    applicant_file_name: ZApplication.shape.applicant_attachment_name,
    applicant_file_content: z.string().max(4215276).openapi({
      description: "Le contenu du fichier du CV du candidat. La taille maximale autorisée est de 3 Mo.",
      example: "data:application/pdf;base64,JVBERi0xLjQKJ...",
    }),
    job_id: z.string(),
  })
  .openapi("V2 - Application")

export type INewApplicationV2NEWCompanySiret = z.output<typeof ZNewApplicationV2NEWCompanySiret>
export type INewApplicationV2NEWJobId = z.output<typeof ZNewApplicationV2NEWJobId>

export const zApplicationRoutesV2 = {
  post: {
    "/application": {
      path: "/application",
      method: "post",
      body: z.union([ZNewApplicationV2NEWCompanySiret, ZNewApplicationV2NEWJobId]),
      response: {
        "200": z.literal("OK").openapi({
          description: "Indique le succès ou l'échec de l'opération",
        }),
      },
      securityScheme: { auth: "api-key", access: null, resources: {} },
      openapi: {
        tags: ["V2 - Applications"] as string[],
        description: `Envoi d'un email de candidature à une offre postée sur La bonne alternance recruteur ou une candidature spontanée à une entreprise identifiée par La bonne alternance.\nL'email est envoyé depuis l'adresse générique 'Ne pas répondre' de La bonne alternance.\n${rateLimitDescription(
          { max: 5, timeWindow: "5s" }
        )}`,
      },
    },
    "/_private/application": {
      path: "/_private/application",
      method: "post",
      body: z.union([ZNewApplicationV2NEWCompanySiret, ZNewApplicationV2NEWJobId]),
      response: {
        "200": z.literal("OK").openapi({
          description: "Indique le succès ou l'échec de l'opération",
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
