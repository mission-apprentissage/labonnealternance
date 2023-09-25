import { ZMetiersDAvenir } from "../models/metiersdavenir.model"

import { IRoutesDef } from "./common.routes"

export const zMetiersDAvenirRoutes = {
  get: {
    "/api/metiersdavenir": {
      response: {
        "200": ZMetiersDAvenir,
      },
    },
  },
} as const satisfies IRoutesDef
