import { ZUnsubscribeQueryParams, ZUnsubscribeQueryResponse } from "../models/unsubscribeLbaCompany.model"
import { rateLimitDescription } from "../utils/rateLimitDescription"

import { IRoutesDef } from "./common.routes"

export const zUnsubscribeRoute = {
  post: {
    "/unsubscribe": {
      method: "post",
      path: "/unsubscribe",
      body: ZUnsubscribeQueryParams,
      response: {
        "200": ZUnsubscribeQueryResponse,
      },
      securityScheme: null,
      openapi: {
        description: `${rateLimitDescription({ max: 1, timeWindow: "5s" })}`,
      },
    },
  },
} as const satisfies IRoutesDef
