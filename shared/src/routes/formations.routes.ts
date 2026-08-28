import { z } from "../helpers/zod-with-open-api.js"
import { zFormationCatalogueSchema } from "../models/formation.model.js"
import { ZLbaItemFormation2 } from "../models/lba-item.model.js"
import type { IRoutesDef } from "./common.routes.js"

export const zFormationsRoutes = {
  get: {
    "/admin/formations": {
      method: "get",
      path: "/admin/formations",
      querystring: z.strictObject({ search_item: z.string() }),
      response: {
        "200": z.array(zFormationCatalogueSchema),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {
          formationCatalogue: [
            {
              cle_ministere_educatif: { type: "query", key: "search_item" },
            },
          ],
        },
      },
    },
    "/_private/formations/:id": {
      method: "get",
      path: "/_private/formations/:id",
      params: z.strictObject({
        id: z.string(),
      }),
      response: {
        "200": ZLbaItemFormation2,
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
