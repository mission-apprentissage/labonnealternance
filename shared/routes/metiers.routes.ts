import { z } from "zod"

import { ZMetiersEnrichis } from "../models/metiers.model"

export const zEtablissementRoutes = {
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
  },
  post: {},
  put: {},
  delete: {},
}
