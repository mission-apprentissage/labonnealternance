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
  post: {
    "/classification": {
      method: "post",
      path: "/classification",
      body: z.object({
        partner_job_ids: z.string().array().min(1, "Il faut au moins un id à mettre à jour"),
        classification: z.enum(["cfa", "entreprise", "entreprise_cfa"]),
      }),
      response: {
        200: z.object({ response: z.literal("Les mises à jour vont être traité par le serveur"), time: z.coerce.date() }),
      },
      securityScheme: {
        auth: "api-key",
        access: null,
        resources: {},
      },
    },
  },
} as const satisfies IRoutesDef
