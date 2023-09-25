import { z } from "zod"

import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { ZAppellationsRomes, ZMetiersEnrichis, ZMetiers } from "../models/metiers.model"

import { ZResError } from "./common.routes"

export const zMetiersRoutes = {
  get: {
    "/api/romelabels": {
      querystring: z.object({ title: z.string(), useMock: z.boolean().nullish(), withRomeLabels: z.boolean().nullish() }).strict(),
      response: {
        "200": ZMetiersEnrichis.or(
          z.object({
            error: z.string().nullish(),
            error_messages: z.array(z.string()).nullish(),
          })
        ),
      },
    },
    "/api/rome": {
      querystring: z.object({ title: z.string(), useMock: z.boolean().nullish(), withRomeLabels: z.boolean().nullish() }).strict(),
      response: {
        "200": ZMetiersEnrichis.or(
          z.object({
            error: z.string().nullish(),
            error_messages: z.array(z.string()).nullish(),
          })
        ),
      },
    },
    "/api/v1/metiers/metiersParFormation/:cfd": {
      param: z
        .object({
          cfd: z.string(),
        })
        .strict(),
      response: {
        200: ZMetiers.strict(),
        500: z.union([ZResError, z.object({ error: z.string() }).strict()]),
      },
    },
    "/api/v1/metiers/metiersParEtablissement/:siret": {
      param: z
        .object({
          siret: z.object({ siret: extensions.siret() }),
        })
        .strict(),
      response: {
        200: ZMetiers.strict(),
        500: z.union([ZResError, z.object({ error: z.string() }).strict()]),
      },
    },
    "/api/v1/metiers/all": {
      response: {
        200: ZMetiers.strict(),
        500: z.union([ZResError, z.object({ error: z.string() }).strict()]),
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
    },
  },
}
