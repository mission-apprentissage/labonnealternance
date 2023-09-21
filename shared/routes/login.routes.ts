import { z } from "zod"

export const zLoginRoutes = {
  get: {},
  post: {
    "/api/login": {
      params: null,
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
