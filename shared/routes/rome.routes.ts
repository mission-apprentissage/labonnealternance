import { z } from "../helpers/zodWithOpenApi"
import { ZMetiersEnrichis } from "../models"
import { ZRomeDetail } from "../models/rome.model"

import { IRoutesDef } from "./common.routes"

export const zRomeRoutes = {
  get: {
    "/rome": {
      // TODO à fusionner avec romeLabels dans metiers.route ou supprimer si obsolète
      querystring: z
        .object({
          title: z.string(),
          withRomeLabels: z.coerce.boolean().optional(),
        })
        .strict(),
      response: {
        "200": ZMetiersEnrichis,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/rome/detail/:rome": {
      // TODO filtrer la payload
      params: z
        .object({
          rome: z.string(),
        })
        .strict(),
      response: {
        "200": ZRomeDetail,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
} as const satisfies IRoutesDef
