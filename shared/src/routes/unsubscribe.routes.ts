import { z } from "zod"

import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"

import { IRoutesDef } from "./common.routes.js"

export const ZUnsubscribePossibleCompany = z.object({
  enseigne: z.string().nullish(),
  siret: z.string(),
  address: z.string(),
})

export type IUnsubscribePossibleCompany = z.output<typeof ZUnsubscribePossibleCompany>

export const zUnsubscribeRoute = {
  post: {
    "/unsubscribe": {
      method: "post",
      path: "/unsubscribe",
      body: z
        .object({
          email: z.string().email(),
          reason: z.string(),
        })
        .strict(),
      response: {
        "200": z.union([
          z.object({
            modifiedCount: z.number(),
          }),
          z.object({
            possibleCompanies: z.array(ZUnsubscribePossibleCompany),
          }),
        ]),
      },
      securityScheme: null,
    },
    "/unsubscribe/sirets": {
      method: "post",
      path: "/unsubscribe/sirets",
      body: z
        .object({
          email: z.string().email(),
          reason: z.string(),
          sirets: z.array(extensions.siret).min(1),
        })
        .strict(),
      response: {
        "200": z.object({
          modifiedCount: z.number(),
        }),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
