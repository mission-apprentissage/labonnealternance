import { z } from "../../helpers/zodWithOpenApi.js"
import { ZSeoVille } from "../../models/index.js"
import { ZSeoMetier } from "../../models/seoMetier.model.js"
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
    "/_private/seo/metier/:metier": {
      method: "get",
      path: "/_private/seo/metier/:metier",
      params: z
        .object({
          metier: z.string(),
        })
        .strict(),
      response: {
        "200": ZSeoMetier.nullable(),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
