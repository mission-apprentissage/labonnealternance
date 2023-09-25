import { z } from "zod"

import { IRoutesDef } from "./common.routes"

export const zLoginRoutes = {
  post: {
    "/api/login": {
      response: {
        "200": z
          .object({
            token: z.string(),
          })
          .strict(),
      },
    },
    "/api/login/confirmation-email": {
      body: z
        .object({
          email: z.string().email(),
        })
        .strict(),
      response: {
        "200": z.undefined(),
      },
    },
    "/api/login/magiclink": {
      body: z
        .object({
          email: z.string().email(),
        })
        .strict(),
      response: {
        "200": z.undefined(),
      },
    },
    "/api/login/verification": {
      response: {
        "200": z
          .object({
            token: z.string(),
          })
          .strict(),
      },
    },
  },
} satisfies IRoutesDef
