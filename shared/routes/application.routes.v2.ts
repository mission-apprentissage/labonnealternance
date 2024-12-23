import { z } from "../helpers/zodWithOpenApi"
import { ZApplicationApiPayload } from "../models"

import { IRoutesDef } from "./common.routes"

export const zApplicationRoutesV2 = {
  post: {
    "/application": {
      path: "/application",
      method: "post",
      body: ZApplicationApiPayload,
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
    "/_private/application": {
      path: "/_private/application",
      method: "post",
      body: ZApplicationApiPayload,
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
