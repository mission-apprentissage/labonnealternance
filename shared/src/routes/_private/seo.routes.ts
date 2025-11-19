import { z } from "../../helpers/zodWithOpenApi.js"
import { ZSeoVille } from "../../models/index.js"
import type { IRoutesDef } from "../common.routes.js"

export const zPrivateSeoRoutes = {
  get: {
    "/_private/seo/ville/:ville": {
      method: "get",
      path: "/_private/seo/ville/:ville",
      params: z
        .object({
          ville: z.string(),
        })
        .strict(),
      response: {
        "200": ZSeoVille.nullable(),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
