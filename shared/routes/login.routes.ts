import { z } from "zod"

export const zLoginRoutes = {
  get: {},
  post: {
    "/api/login": {
      body: null, // basic auth
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
        "200": null,
      },
    },
    "/api/login/magiclink": {
      body: z
        .object({
          email: z.string().email(),
        })
        .strict(),
      response: {
        "200": null,
      },
    },
    "/api/login/verification": {
      body: null, // jwt token
      response: {
        "200": z
          .object({
            token: z.string(),
          })
          .strict(),
      },
    },
  },
  put: {},
  delete: {},
}
