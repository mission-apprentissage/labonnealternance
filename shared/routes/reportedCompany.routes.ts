import { LBA_ITEM_TYPE } from "../constants/lbaitem.js"
import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"

import { IRoutesDef } from "./common.routes.js"

export const zReportedCompanyRoutes = {
  post: {
    "/report-company": {
      method: "post",
      path: "/report-company",
      querystring: z
        .object({
          type: extensions.buildEnum(LBA_ITEM_TYPE),
          itemId: z.string(),
        })
        .strict(),
      body: z
        .object({
          reason: z.string(),
          reasonDetails: z.string().optional(),
        })
        .strict(),
      response: {
        "200": z.object({}),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
