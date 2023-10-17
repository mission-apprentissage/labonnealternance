import { ZMetiersDAvenir } from "../models/metiersdavenir.model"

import { IRoutesDef } from "./common.routes"

export const zMetiersDAvenirRoutes = {
  get: {
    "/metiersdavenir": {
      method: "get",
      path: "/metiersdavenir",
      response: {
        "200": ZMetiersDAvenir,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
} as const satisfies IRoutesDef
