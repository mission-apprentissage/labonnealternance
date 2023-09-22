import { z } from "zod"

import { ZLbaItem } from "../models/lbaItem.model"

export const zV1JobsEtFormationsRoutes = {
  get: {
    "/api/v1/formationsParRegion": {
      queryString: z
        .object({
          romes: z.string().optional(),
          romeDomain: z.string().optional(),
          caller: z.string().optional(),
          departement: z.string().optional(),
          region: z.string().optional(),
          diploma: z.string().optional(),
          options: z.string().optional(), // hidden
          useMock: z.string().optional(), // hidden
        })
        .strict(),
      response: {
        "200": z
          .object({
            results: z.array(ZLbaItem),
          })
          .strict(),
      },
    },
  },
  post: {},
  put: {},
  delete: {},
}
