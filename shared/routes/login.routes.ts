import { z } from "zod"

export const zLoginRoutes = {
  get: {},
  post: {
    "/api/login": {
      queryParams: null, // basic auth
      response: {
        "2xx": z.object({
          token: z.string(),
        }),
      },
    },
    "/api/login/confirmation-email": {
      queryParams: z.object({
        email: z.string().email(),
      }),
      response: {
        "2xx": null,
      },
    },
    "/api/login/magiclink": {
      queryParams: z.object({
        email: z.string().email(),
      }),
      response: {
        "2xx": null,
      },
    },
    "/api/login/verification": {
      queryParams: null, // jwt token
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
