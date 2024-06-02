import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"
import { ZLbaCompanyForContactUpdate } from "../models"
import { rateLimitDescription } from "../utils/rateLimitDescription"

import { IRoutesDef } from "./common.routes"

export const zUpdateLbaCompanyRoutes = {
  get: {
    "/updateLBB/updateContactInfo": {
      method: "get",
      path: "/updateLBB/updateContactInfo",
      querystring: z
        .object({
          secret: z.string(),
          siret: extensions.siret,
          email: z.string().email().or(z.literal("")).optional(),
          phone: extensions.phone().or(z.literal("")).optional(),
        })
        .strict(),
      response: {
        "200": z.literal("OK"),
      },
      securityScheme: null,
      openapi: {
        description: `${rateLimitDescription({ max: 1, timeWindow: "20s" })}`,
      },
    },

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
      securityScheme: null,
      // securityScheme: {
      //   auth: "cookie-session",
      //   access: "admin",
      //   resources: {},
      // },
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
      securityScheme: null,
      // securityScheme: {
      //   auth: "cookie-session",
      //   access: "admin",
      //   resources: {},
      // },
      openapi: {
        description: `${rateLimitDescription({ max: 1, timeWindow: "5s" })}`,
      },
    },
  },
} as const satisfies IRoutesDef
