import { z } from "zod"

import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { ZAppellationsRomes, ZMetiersEnrichis, ZMetiers } from "../models/metiers.model"

import { IRoutesDef, ZResError } from "./common.routes"

export const zMetiersRoutes = {
  get: {
    "/api/v1/metiers/metiersParFormation/:cfd": {
      params: z
        .object({
          cfd: z.string(),
        })
        .strict(),
      response: {
        200: ZMetiers.strict(),
        500: z.union([ZResError, z.object({ error: z.string() }).strict()]),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/v1/metiers/metiersParEtablissement/:siret": {
      params: z
        .object({
          siret: z.object({ siret: extensions.siret() }),
        })
        .strict(),
      response: {
        200: ZMetiers.strict(),
        500: z.union([ZResError, z.object({ error: z.string() }).strict()]),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/v1/metiers/all": {
      response: {
        200: ZMetiers.strict(),
        500: z.union([ZResError, z.object({ error: z.string() }).strict()]),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/v1/metiers": {
      querystring: z
        .object({
          title: z.string().optional(),
          romes: z.array(z.string()).optional(),
          rncps: z.array(z.string()).optional(),
        })
        .strict(),
      response: {
        200: ZMetiersEnrichis.omit({
          labelsAndRomesForDiplomas: true,
        }).strict(),
        400: z.union([ZResError, z.object({ error: z.string() }).strict()]),
        500: z.union([ZResError, z.object({ error: z.string() }).strict()]),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/v1/metiers/intitule": {
      querystring: z
        .object({
          label: z.string(),
        })
        .strict(),
      response: {
        200: ZAppellationsRomes.strict(),
        400: z.union([ZResError, z.object({ error: z.string() }).strict()]),
        500: z.union([ZResError, z.object({ error: z.string() }).strict()]),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
} as const satisfies IRoutesDef
