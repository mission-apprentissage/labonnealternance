import { z } from "zod"

import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { ZLbacError } from "../models"
import { ZApplicationUI } from "../models/applications.model"

import { IRoutesDef, ZResError } from "./common.routes"

export const zApplicationRoutes = {
  post: {
    "/v1/application": {
      body: ZApplicationUI,
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
      securityScheme: {
        auth: "none",
        role: "all",
      },
      openapi: {
        description:
          "Envoi d'un email de candidature à une offre postée sur La bonne alternance recruteur ou une candidature spontanée à une entreprise identifiée par La bonne alternance.\nL'email est envoyé depuis l'adresse générique \"Ne pas répondre\" de La bonne alternance.\n",
      },
    },
    "/application/intentionComment": {
      // TODO_SECURITY_FIX
      body: z
        .object({
          id: z.string(), // inutile de chiffrer l'id, rajouter un champ token qui contiendra l'id
          iv: z.string(),
          comment: z.string(),
          intention: z.string(),
          email: z.string(),
          phone: z.string(),
        })
        .strict(),
      response: {
        "200": z.union([
          z
            .object({
              result: z.literal("ok"),
              message: z.literal("comment registered"),
            })
            .strict(),
          z
            .object({
              error: z.literal("error_saving_comment"),
            })
            .strict(),
        ]),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/application/webhook": {
      // TODO_SECURITY_FIX    ajouter token sans expiration dans les webhooks brevo
      body: extensions.brevoWebhook(),
      response: {
        "200": z
          .object({
            result: z.literal("ok"),
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
