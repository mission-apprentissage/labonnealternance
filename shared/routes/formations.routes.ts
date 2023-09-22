import { z } from "zod"

import { zFormationCatalogueSchema } from "../models/formationCatalogue/formation.model"

export const zFormationRoute = {
  get: {
    "/api/admin/formations/": {
      queryString: z.object({ query: z.string() }).strict(),
      response: {
        "2xx": z.array(zFormationCatalogueSchema),
      },
    },
  },
}
