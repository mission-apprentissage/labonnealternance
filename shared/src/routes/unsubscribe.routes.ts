import { z } from "zod"

import { extensions } from "../helpers/zod-helpers/zod-primitives.js"
import { UNSUBSCRIBE_REASON_DETAIL_MAX_LENGTH } from "../models/unsubscribed-recruteur-lba.model.js"

import type { IRoutesDef } from "./common.routes.js"

const zReasonDetail = z.string().trim().max(UNSUBSCRIBE_REASON_DETAIL_MAX_LENGTH).nullish()

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
      body: z.strictObject({
        email: z.email(),
        reason: z.string(),
        reason_detail: zReasonDetail,
      }),
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
      body: z.strictObject({
        email: z.email(),
        reason: z.string(),
        reason_detail: zReasonDetail,
        sirets: z.array(extensions.siret).min(1),
      }),
      response: {
        "200": z.object({
          modifiedCount: z.number(),
        }),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
