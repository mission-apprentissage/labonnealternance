import { z } from "../helpers/zodWithOpenApi.js"
import { ZLbacError } from "../models/lbacError.model.js"
import { ZLbaItemFormationResult } from "../models/lbaItem.model.js"

import { zCallerParam, zDiplomaParam, zGetFormationOptions, zRefererHeaders } from "./_params.js"
import type { IRoutesDef } from "./common.routes.js"
import { ZResError } from "./common.routes.js"

export const zV1FormationsParRegion = {
  get: {
    "/v1/formationsParRegion": {
      method: "get",
      path: "/v1/formationsParRegion",
      querystring: z
        .object({
          romes: z
            .string()
            .optional(),
          romeDomain: z.string().optional(),
          caller: zCallerParam,
          departement: z
            .string()
            .optional(),
          region: z
            .string()
            .optional(),
          diploma: zDiplomaParam,
          options: zGetFormationOptions,
        })
        .strict()
        .passthrough(),
      headers: zRefererHeaders,
      response: {
        "200": ZLbaItemFormationResult,
        "400": z.union([ZResError, ZLbacError]),
        "500": z.union([ZResError, ZLbacError]),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
