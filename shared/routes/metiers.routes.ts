import { z } from "zod"

import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { ZAppellationsRomes, ZMetierEnrichi, ZMetiers } from "../models/metiers.model"

import { IRoutesDef } from "./common.routes"

export const zMetiersRoutes = {
  get: {
    "/api/v1/metiers/metiersParFormation/:cfd": {
      params: z
        .object({
          cfd: z.string(),
        })
        .strict(),
      response: {
        200: ZMetiers,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/v1/metiers/metiersParEtablissement/:siret": {
      params: z
        .object({
          siret: extensions.siret(),
        })
        .strict(),
      response: {
        200: ZMetiers,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/v1/metiers/all": {
      response: {
        200: ZMetiers,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/v1/metiers": {
      querystring: z
        .object({
          title: z.string(),
          romes: z.array(z.string()).optional(),
          rncps: z.array(z.string()).optional(),
        })
        .strict(),
      response: {
        200: z
          .object({
            labelsAndRomes: ZMetierEnrichi.array(),
          })
          .strict(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/v1/metiers/intitule": {
      querystring: z
        .object({
          label: z.string().nonempty(),
        })
        .strict(),
      response: {
        200: ZAppellationsRomes.strict(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
} as const satisfies IRoutesDef
