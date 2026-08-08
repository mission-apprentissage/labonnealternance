import { LBA_ITEM_TYPE } from "../constants/lbaitem.js"
import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"

import type { IRoutesDef } from "./common.routes.js"

export const zReportedCompanyRoutes = {
  post: {
    "/report-company": {
      method: "post",
      path: "/report-company",
      querystring: z.strictObject({
        type: extensions.buildEnum(LBA_ITEM_TYPE),
        itemId: z.string(),
      }),
      body: z.strictObject({
        reason: z.string(),
        reasonDetails: z.string().optional(),
      }),
      response: {
        "200": z.object({}),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
