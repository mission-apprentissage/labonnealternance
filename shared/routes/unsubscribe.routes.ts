import { ZUnsubscribeQueryParams, ZUnsubscribeQueryResponse } from "../models/unsubscribedRecruteurLba.model"

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
    },
  },
} as const satisfies IRoutesDef
