import { ApplicationIntention, RefusalReasons } from "../constants/application.js"
import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"
import { ZHelloworkApplication, ZNewApplication } from "../models/applications.model.js"
import { ZLbacError } from "../models/lbacError.model.js"
import { rateLimitDescription } from "../utils/rateLimitDescription.js"

import type { IRoutesDef } from "./common.routes.js"
import { ZResError } from "./common.routes.js"

export const zApplicationRoutes = {
  post: {
    "/v1/application": {
      path: "/v1/application",
      method: "post",
      body: ZNewApplication,
      response: {
        "200": z
          .object({
            result: z.literal("ok").openapi({
              description: "Indique le succès ou l'échec de l'opération",
              example: "ok",
            }),
            message: z.literal("messages sent"),
          })
          .strict(),
        "400": z.union([ZResError, ZLbacError]).openapi({
          description: "Bad Request",
        }),
        "500": z.union([ZResError, ZLbacError]).openapi({
          description: "Internal Server Error",
        }),
      },
      securityScheme: null,
      openapi: {
        tags: ["V1 - Applications"] as string[],
        description: `Envoi d'un email de candidature à une offre postée sur La bonne alternance recruteur ou une candidature spontanée à une entreprise identifiée par La bonne alternance.\nL'email est envoyé depuis l'adresse générique 'Ne pas répondre' de La bonne alternance.\n${rateLimitDescription(
          { max: 5, timeWindow: "5s" }
        )}`,
      },
    },
    "/application/intentionComment/:id": {
      path: "/application/intentionComment/:id",
      method: "post",
      params: z.object({ id: z.string() }).strict(),
      body: z
        .object({
          company_feedback: z.string().nonempty("Veuillez remplir le message"),
          company_recruitment_intention: z.literal(ApplicationIntention.ENTRETIEN),
          email: z.string().email("Adresse e-mail invalide"),
          phone: z.string().regex(/^[0-9]{10}$/, "Le numéro de téléphone doit avoir exactement 10 chiffres"),
        })
        .passthrough()
        .or(
          z
            .object({
              company_feedback: z.string().nonempty("Veuillez remplir le message"),
              company_recruitment_intention: z.literal(ApplicationIntention.REFUS),
              refusal_reasons: z.array(extensions.buildEnum(RefusalReasons)),
            })
            .passthrough()
        ),

      response: {
        "200": z.object({}).strict(),
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        resources: {},
      },
    },
    "/application/intention/cancel/:id": {
      path: "/application/intention/cancel/:id",
      method: "post",
      params: z.object({ id: z.string() }).strict(),
      response: {
        "200": z.object({}).strict(),
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        resources: {},
      },
    },
    "/application/hellowork": {
      path: "/application/hellowork",
      method: "post",
      body: ZHelloworkApplication,
      response: {
        "200": z
          .object({
            result: z.object({ status: z.literal("ok") }),
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
  get: {
    "/application/company/email": {
      path: "/application/company/email",
      method: "get",
      querystring: z.object({ token: z.string() }).strict(),
      response: {
        "200": z
          .object({
            company_email: z.string().email(),
          })
          .strict(),
      },
      securityScheme: null,
    },
    "/application/intention/schedule/:id": {
      path: "/application/intention/schedule/:id",
      method: "get",
      params: z.object({ id: z.string() }).strict(),
      querystring: z.object({ intention: extensions.buildEnum(ApplicationIntention) }).strict(),
      response: {
        "200": z
          .object({
            recruiter_email: z.string(),
            recruiter_phone: z.string(),
            applicant_first_name: z.string(),
            applicant_last_name: z.string(),
            company_name: z.string(),
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
