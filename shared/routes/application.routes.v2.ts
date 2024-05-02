import { z } from "../helpers/zodWithOpenApi"
import { ZNewApplicationV2NEW } from "../models/applications.model"
import { rateLimitDescription } from "../utils/rateLimitDescription"

import { IRoutesDef } from "./common.routes"

export const zApplicationRoutesV2 = {
  post: {
    "/application": {
      path: "/application",
      method: "post",
      body: ZNewApplicationV2NEW,
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
  },
} as const satisfies IRoutesDef
