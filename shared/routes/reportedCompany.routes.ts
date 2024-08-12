import { LBA_ITEM_TYPE } from "../constants/lbaitem"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { IRoutesDef } from "./common.routes"

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
      response: {
        "200": z.object({}),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
