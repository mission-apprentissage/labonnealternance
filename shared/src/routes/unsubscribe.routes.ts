import { ZUnsubscribeQueryParams, ZUnsubscribeQueryResponse } from "../models/unsubscribedRecruteurLba.model.js"

import { IRoutesDef } from "./common.routes.js"

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
