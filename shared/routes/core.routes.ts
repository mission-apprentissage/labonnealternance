import { z } from "../helpers/zodWithOpenApi"

import { IRoutesDef, ZResError } from "./common.routes"

const zResponse = z
  .object({
    name: z.string(),
    version: z.string(),
    env: z.enum(["local", "recette", "pentest", "production", "preview"]),
    mongo: z.boolean(),
  })
  .strict()

export const zCoreRoutes = {
  get: {
    "/": {
      method: "get",
      path: "/",
      response: {
        "200": zResponse,
        "500": z.union([ZResError, zResponse]),
      },
      securityScheme: null,
    },
    "/healthcheck": {
      method: "get",
      path: "/healthcheck",
      response: {
        "200": zResponse,
        "500": z.union([ZResError, zResponse]),
      },
      securityScheme: null,
    },
    "/version": {
      method: "get",
      path: "/version",
      response: {
        "200": z
          .object({
            version: z.string(),
          })
          .strict(),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
