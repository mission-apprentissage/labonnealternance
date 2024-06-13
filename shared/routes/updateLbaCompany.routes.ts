import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"
import { ZLbaCompanyForContactUpdate } from "../models"

import { IRoutesDef } from "./common.routes"

export const zUpdateLbaCompanyRoutes = {
  get: {
    "/lbacompany/:siret/contactInfo": {
      method: "get",
      path: "/lbacompany/:siret/contactInfo",
      params: z
        .object({
          siret: extensions.siret,
        })
        .strict(),
      response: {
        "200": ZLbaCompanyForContactUpdate,
      },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {},
      },
    },
  },

  put: {
    "/lbacompany/:siret/contactInfo": {
      method: "put",
      path: "/lbacompany/:siret/contactInfo",
      params: z
        .object({
          siret: extensions.siret,
        })
        .strict(),
      body: z.object({
        email: z.string().email().or(z.literal("")).optional(),
        phone: extensions.phone().or(z.literal("")).optional(),
      }),
      response: {
        "200": ZLbaCompanyForContactUpdate,
      },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {},
      },
    },
  },
} as const satisfies IRoutesDef
