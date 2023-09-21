import { ZMetiersDAvenir } from "models/metiersdavenir.model"

export const zMetiersDAvenirRoutes = {
  get: {
    "/api/metiersdavenir": {
      response: {
        "2xx": ZMetiersDAvenir,
      },
    },
  },
}
