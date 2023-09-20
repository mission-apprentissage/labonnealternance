import { z } from "zod"

export const zCoreRoutes = {
  get: {
    "/api": {
      response: {
        "2xx": z
          .object({
            env: z.enum(["local", "recette", "production", "preview"]),
            healthcheck: z
              .object({
                mongodb: z.boolean(),
              })
              .strict(),
          })
          .describe("API Health"),
      },
    },
    "/api/healthcheck": {
      response: {
        "2xx": z
          .object({
            env: z.enum(["local", "recette", "production", "preview"]),
            healthcheck: z.object({
              mongodb: z.boolean(),
            }),
          })
          .describe("API Health"),
      },
    },
  },
  post: {},
  put: {},
  delete: {},
}
