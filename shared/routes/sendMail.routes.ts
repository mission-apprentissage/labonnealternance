import { z } from "zod"

import { ZLbaItem } from "../models/lbaItem.model"

import { IRoutesDef } from "./common.routes"

export const zMailRoutes = {
  get: {
    "/api/mail": {
      querystring: z
        .object({
          secret: z.string().nullish(),
          email: z.string().email(),
          applicant_email: z.string().email(),
        })
        .strict(),
      response: {
        "200": z
          .object({
            results: z.array(ZLbaItem),
          })
          .strict(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
} as const satisfies IRoutesDef
