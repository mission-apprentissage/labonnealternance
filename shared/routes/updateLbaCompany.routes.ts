import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

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
    },
  },
} as const satisfies IRoutesDef
