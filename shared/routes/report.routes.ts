import { LBA_ITEM_TYPE } from "../constants/lbaitem"
import { z } from "../helpers/zodWithOpenApi"
import { enumToZod } from "../models/enumToZod"

import { IRoutesDef } from "./common.routes"

export const zReportRoutes = {
  post: {
    "/report": {
      method: "post",
      path: "/report",
      querystring: z
        .object({
          type: enumToZod(LBA_ITEM_TYPE),
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
