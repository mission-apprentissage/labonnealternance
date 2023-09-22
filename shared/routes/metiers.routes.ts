import { z } from "zod"

import { ZMetiersEnrichis, ZMetiers } from "../models/metiers.model"

export const zMetiersRoutes = {
  get: {
    "/api/romelabels": {
      queryParams: z.object({ title: z.string(), useMock: z.boolean().nullish(), withRomeLabels: z.boolean().nullish() }).strict(),
      response: {
        "200": ZMetiersEnrichis.or(
          z.object({
            error: z.string().nullish(),
            error_messages: z.string().array().nullish(),
          })
        ),
      },
    },
    "/api/rome": {
      queryParams: z.object({ title: z.string(), useMock: z.boolean().nullish(), withRomeLabels: z.boolean().nullish() }).strict(),
      response: {
        "200": ZMetiersEnrichis.or(
          z.object({
            error: z.string().nullish(),
            error_messages: z.string().array().nullish(),
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
        500: z.object({ error: z.string() }).strict(),
      },
    },
    "/api/v1/metiers/metiersParEtablissement/:siret": {
      param: z
        .object({
          siret: z.string(),
        })
        .strict(),
      response: {
        200: ZMetiers.strict(),
        500: z.object({ error: z.string() }).strict(),
      },
    },
    "/api/v1/metiers/all": {
      param: z
        .object({
          siret: z.string(),
        })
        .strict(),
      response: {
        200: ZMetiers.strict(),
        500: z.object({ error: z.string() }).strict(),
      },
    },
  },
  post: {},
  put: {},
  delete: {},
}
