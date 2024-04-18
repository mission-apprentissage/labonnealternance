import { z } from "../helpers/zodWithOpenApi"
import { rateLimitDescription } from "../utils/rateLimitDescription"

import { IRoutesDef, ZResError } from "./common.routes"

const zResponse = z
  .object({
    env: z.enum(["local", "recette", "pentest", "production", "preview"]),
    healthcheck: z
      .object({
        mongodb: z.boolean(),
      })
      .strict(),
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
      openapi: {
        description: `${rateLimitDescription({ max: 3, timeWindow: "1s" })}`,
      },
    },
  },
} as const satisfies IRoutesDef
