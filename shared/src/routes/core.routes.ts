import { z } from "../helpers/zodWithOpenApi.js"

import type { IRoutesDef } from "./common.routes.js"
import { ZResError } from "./common.routes.js"

const zResponse = z.strictObject({
  name: z.string(),
  version: z.string(),
  commitHash: z.string(),
  env: z.enum(["local", "recette", "pentest", "production", "preview"]),
  mongo: z.boolean(),
  error: z.boolean(),
  processor: z.unknown().optional(),
})

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
    "/livez": {
      method: "get",
      path: "/livez",
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
        "200": z.strictObject({
          version: z.string(),
        }),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
