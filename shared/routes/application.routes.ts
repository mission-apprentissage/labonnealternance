import { z } from "zod"

import { ZApplicationUI } from "../models/applications.model"

export const zApplicationRoutes = {
  post: {
    "/api/V1/application": {
      queryParams: ZApplicationUI,
      response: {
        "2xx": {
          result: "ok",
          message: "messages sent",
        },
      },
    },
    "/api/application": {
      queryParams: ZApplicationUI,
      response: {
        "2xx": {
          result: "ok",
          message: "messages sent",
        },
      },
    },
    "/api/application/intentionComment": {
      response: {
        queryParams: z.object({
          id: z.string(),
          iv: z.string(),
          comment: z.string(),
        }),
        "2xx": {
          result: "ok",
          message: "comment registered",
        },
      },
    },
  },
}
