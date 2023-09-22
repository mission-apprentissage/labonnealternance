import { z } from "zod"

import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { ZAppellationsRomes, ZMetiersEnrichis, ZMetiers } from "../models/metiers.model"

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
          siret: z.object({ siret: extensions.siret() }),
        })
        .strict(),
      response: {
        200: ZMetiers.strict(),
        500: z.object({ error: z.string() }).strict(),
      },
    },
    "/api/v1/metiers/all": {
      response: {
        200: ZMetiers.strict(),
        500: z.object({ error: z.string() }).strict(),
      },
    },
    "/api/v1/metiers": {
      queryParams: z
        .object({
          title: z.string().optional(),
          romes: z.string().array().optional(),
          rncps: z.string().array().optional(),
        })
        .strict(),
      response: {
        200: ZMetiersEnrichis.omit({
          labelsAndRomesForDiplomas: true,
        }).strict(),
        400: z.object({ error: z.string() }).strict(),
        500: z.object({ error: z.string() }).strict(),
      },
    },
    "/api/v1/metiers/intitule": {
      queryParams: z
        .object({
          label: z.string(),
        })
        .strict(),
      response: {
        200: ZAppellationsRomes.strict(),
        400: z.object({ error: z.string() }).strict(),
        500: z.object({ error: z.string() }).strict(),
      },
    },
  },
}
