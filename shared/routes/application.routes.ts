import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"
import { ZLbacError } from "../models"
import { ZNewApplication } from "../models/applications.model"
import { rateLimitDescription } from "../utils/rateLimitDescription"

import { IRoutesDef, ZResError } from "./common.routes"

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
    "/application/intention/:id": {
      path: "/application/intention/:id",
      method: "post",
      params: z.object({ id: z.string() }).strict(),
      body: z
        .object({
          company_recruitment_intention: z.string(),
        })
        .strict(),
      response: {
        "200": z
          .object({
            result: z.literal("ok"),
          })
          .strict(),
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        resources: {},
      },
    },
    "/application/intentionComment/:id": {
      path: "/application/intentionComment/:id",
      method: "post",
      params: z.object({ id: z.string() }).strict(),
      body: z
        .object({
          company_feedback: z.string(),
          company_recruitment_intention: z.string(),
          email: z.string().email().or(z.literal("")),
          phone: extensions.phone().or(z.literal("")),
        })
        .strict(),
      response: {
        "200": z
          .object({
            result: z.literal("ok"),
            message: z.literal("comment registered"),
          })
          .strict(),
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        resources: {},
      },
    },
    "/application/cancelIntention/:id": {
      path: "/application/cancelIntention/:id",
      method: "post",
      params: z.object({ id: z.string() }).strict(),
      response: {
        "200": z
          .object({
            result: z.literal("ok"),
            message: z.literal("intention canceled"),
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
    "/application/dataForIntention/:id": {
      path: "/application/dataForIntention/:id",
      method: "get",
      params: z.object({ id: z.string() }).strict(),
      response: {
        "200": z
          .object({
            recruiter_email: z.string(),
            recruiter_phone: z.string(),
            applicant_first_name: z.string(),
            applicant_last_name: z.string(),
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
