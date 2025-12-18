import z from "zod"

import type { IRoutesDef } from "./common.routes.js"

export const zClassificationRoute = {
  get: {
    "/classification": {
      method: "get",
      path: "/classification",
      response: {
        200: z.array(
          z.object({
            label: z.string(),
            workplace_name: z.string().nullable(),
            workplace_description: z.string().nullable(),
            offer_title: z.string(),
            offer_description: z.string(),
          })
        ),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
