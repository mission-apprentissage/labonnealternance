import { z } from "zod"

import { ZLbacError } from "../models/lbacError.model"
import { ZLbaItem } from "../models/lbaItem.model"

import { IRoutesDef } from "./common.routes"

export const zV1FormationsParRegion = {
  get: {
    "/api/v1/formationsParRegion": {
      querystring: z
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
      headers: z
        .object({
          referer: z.string().optional(),
        })
        .strict(),
      response: {
        "200": z
          .object({
            results: z.array(ZLbaItem),
          })
          .strict(),
        "400": ZLbacError,
        "500": ZLbacError,
      },
    },
  },
  put: {},
  patch: {},
  post: {},
  delete: {},
} satisfies IRoutesDef
