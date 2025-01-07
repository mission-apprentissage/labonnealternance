import { z } from "../helpers/zodWithOpenApi"
import { ZApplicationApiPrivate, ZApplicationApiPublic } from "../models"

import { IRoutesDef } from "./common.routes"

export const zApplicationRoutesV2 = {
  post: {
    "/v2/application": {
      path: "/v2/application",
      method: "post",
      body: ZApplicationApiPublic,
      response: {
        "202": z.object({
          id: z.string(),
        }),
      },
      securityScheme: { auth: "api-apprentissage", access: "api-apprentissage:applications", resources: {} },
      openapi: {
        tags: ["V2 - Application"] as string[],
      },
    },
    "/v2/_private/application": {
      path: "/v2/_private/application",
      method: "post",
      body: ZApplicationApiPrivate,
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
