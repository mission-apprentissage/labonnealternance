import { z } from "zod"

import { zFormationCatalogueSchema } from "../models/formation.model"

import { IRoutesDef } from "./common.routes"

export const zFormationRoute = {
  get: {
    "/api/admin/formations": {
      querystring: z.object({ search_item: z.string() }).strict(),
      response: {
        "2xx": z.array(zFormationCatalogueSchema),
      },
      securityScheme: {
        auth: "jwt-rdv-admin",
        role: "administrator",
      },
    },
  },
} as const satisfies IRoutesDef
