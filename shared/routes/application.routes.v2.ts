import { z } from "../helpers/zodWithOpenApi"
import { ZApplicationApiPrivate, ZApplicationApiPublic } from "../models"

import { IRoutesDef } from "./common.routes"

export const zApplicationRoutesV2 = {
  post: {
    "/application": {
      path: "/application",
      method: "post",
      body: ZApplicationApiPrivate,
      response: {
        "202": z.object({
          id: z.string(),
        }),
      },
      securityScheme: { auth: "api-apprentissage", access: "api-apprentissage:applications", resources: {} },
    },
    "/_private/application": {
      path: "/_private/application",
      method: "post",
      body: ZApplicationApiPublic,
      response: {
        "200": z.object({}),
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        resources: {},
      },
    },
  },
} as const satisfies IRoutesDef
