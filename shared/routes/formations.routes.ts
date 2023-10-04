import { z } from "../helpers/zodWithOpenApi"
import { zFormationCatalogueSchema } from "../models/formation.model"

import { IRoutesDef } from "./common.routes"

export const zFormationRoute = {
  get: {
    "/admin/formations": {
      querystring: z.object({ search_item: z.string() }).strict(),
      response: {
        "2xx": z.array(zFormationCatalogueSchema),
      },
      securityScheme: {
        auth: "cookie-session",
        role: "all", // TODO administrator
      },
    },
  },
} as const satisfies IRoutesDef
