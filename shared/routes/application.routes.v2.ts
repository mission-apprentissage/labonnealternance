import { z } from "../helpers/zodWithOpenApi"
import { ZLbacError } from "../models"
import { ZNewApplication } from "../models/applications.model"

import { IRoutesDef, ZResError } from "./common.routes"

export const zApplicationRoutesV2 = {
  post: {
    "/application": {
      path: "/application",
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
      securityScheme: { auth: "api-key", access: null, resources: {} },
      openapi: {
        tags: ["V2 - Applications"] as string[],
        description:
          "Envoi d'un email de candidature à une offre postée sur La bonne alternance recruteur ou une candidature spontanée à une entreprise identifiée par La bonne alternance.\nL'email est envoyé depuis l'adresse générique \"Ne pas répondre\" de La bonne alternance.\n",
      },
    },
  },
} as const satisfies IRoutesDef
