import { z } from "zod"

export const zLoginRoutes = {
  get: {},
  post: {
    "/api/login": {
      body: null, // basic auth
      response: {
        "2xx": z.object({
          token: z.string(),
        }),
      },
    },
    "/api/login/confirmation-email": {
      body: z.object({
        email: z.string().email(),
      }),
      response: {
        "2xx": null,
      },
    },
    "/api/login/magiclink": {
      body: z.object({
        email: z.string().email(),
      }),
      response: {
        "2xx": null,
      },
    },
    "/api/login/verification": {
      body: null, // jwt token
      response: {
        "2xx": z.object({
          token: z.string(),
        }),
      },
    },
  },
  put: {},
  delete: {},
}
