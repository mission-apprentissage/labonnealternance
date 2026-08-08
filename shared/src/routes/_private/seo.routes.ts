import { z } from "../../helpers/zod-with-open-api.js"
import { ZSeoDiplome, ZSeoVille } from "../../models/index.js"
import { ZSeoMetier } from "../../models/seo-metier.model.js"
import type { IRoutesDef } from "../common.routes.js"

export const zPrivateSeoRoutes = {
  get: {
    "/_private/seo/ville/:ville": {
      method: "get",
      path: "/_private/seo/ville/:ville",
      params: z.strictObject({
        ville: z.string(),
      }),
      response: {
        "200": ZSeoVille.nullable(),
      },
      securityScheme: null,
    },
    "/_private/seo/metier/:metier": {
      method: "get",
      path: "/_private/seo/metier/:metier",
      params: z.strictObject({
        metier: z.string(),
      }),
      response: {
        "200": ZSeoMetier.nullable(),
      },
      securityScheme: null,
    },
    "/_private/seo/diplome/:diplome": {
      method: "get",
      path: "/_private/seo/diplome/:diplome",
      params: z.strictObject({
        diplome: z.string(),
      }),
      response: {
        "200": ZSeoDiplome.nullable(),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
