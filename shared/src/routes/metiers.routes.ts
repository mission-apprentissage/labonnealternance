import { z } from "../helpers/zodWithOpenApi.js"
import { ZAppellationsRomes, ZMetierEnrichiArray, ZMetiers } from "../models/diplomesMetiers.model.js"

import type { IRoutesDef } from "./common.routes.js"

export const zMetiersRoutes = {
  get: {
    "/v1/metiers/metiersParFormation/:cfd": {
      method: "get",
      path: "/v1/metiers/metiersParFormation/:cfd",
      params: z
        .object({
          cfd: z
            .string()
            .min(1)
        })
        .strict(),
      response: {
        200: ZMetiers,
      },
      securityScheme: null,
    },
    "/v1/metiers/all": {
      method: "get",
      path: "/v1/metiers/all",
      response: {
        200: ZMetiers,
      },
      securityScheme: null,
    },
    "/v1/metiers": {
      method: "get",
      path: "/v1/metiers",
      querystring: z
        .object({
          title: z.string(),
          romes: z
            .string()

            .optional(),
          rncps: z
            .string()
            .optional()
        })
        .strict(),
      response: {
        200: z
          .object({
            labelsAndRomes: ZMetierEnrichiArray,
          })
          .strict(),
      },
      securityScheme: null,
    },
    "/v1/metiers/intitule": {
      method: "get",
      path: "/v1/metiers/intitule",
      querystring: z
        .object({
          label: z.string().nonempty(),
        })
        .strict(),
      response: {
        200: ZAppellationsRomes.strict(),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
