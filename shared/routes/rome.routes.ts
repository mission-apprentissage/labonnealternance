import { z } from "../helpers/zodWithOpenApi"
import { ZMetiersEnrichis } from "../models"
import { ZRomeDetail } from "../models/rome.model"

import { IRoutesDef } from "./common.routes"

export const zRomeRoutes = {
  get: {
    "/rome": {
      method: "get",
      path: "/rome",
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
      securityScheme: null,
    },
    "/rome/detail/:rome": {
      method: "get",
      path: "/rome/detail/:rome",
      params: z
        .object({
          rome: z.string(),
        })
        .strict(),
      response: {
        "200": ZRomeDetail,
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
