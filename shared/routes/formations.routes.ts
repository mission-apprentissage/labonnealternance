import { z } from "zod"

import { zFormationCatalogueSchema } from "../models/formationCatalogue/formation.model"

import { IRoutesDef } from "./common.routes"

export const zFormationRoute = {
  get: {
    "/api/admin/formations": {
      querystring: z.object({ query: z.string() }).strict(),
      response: {
        "2xx": z.array(zFormationCatalogueSchema),
      },
      securityScheme: {
        auth: "jwt-rdv-admin",
        role: "admin",
      },
    },
  },
} as const satisfies IRoutesDef
