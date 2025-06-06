import { z } from "../helpers/zodWithOpenApi.js"

import { IRoutesDef, ZResError } from "./common.routes.js"

const zResponse = z
  .object({
    name: z.string(),
    version: z.string(),
    commitHash: z.string(),
    env: z.enum(["local", "recette", "pentest", "production", "preview"]),
    mongo: z.boolean(),
    error: z.boolean(),
    processor: z.unknown(),
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
