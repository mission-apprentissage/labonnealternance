import { ZMetiersDAvenir } from "../models/metiersdavenir.model.js"

import { IRoutesDef } from "./common.routes.js"

export const zMetiersDAvenirRoutes = {
  get: {
    "/metiersdavenir": {
      method: "get",
      path: "/metiersdavenir",
      response: {
        "200": ZMetiersDAvenir,
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
