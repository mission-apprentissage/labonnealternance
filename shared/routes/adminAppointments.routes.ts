import { z } from "zod"

import { ZAppointment } from "../models"

import { IRoutesDef } from "./common.routes"

export const zAdminAppointementsRoutes = {
  get: {
    "/api/admin/appointments": {
      querystring: z
        .object({
          query: z.string().nullish(),
          limit: z.number().optional().default(50),
          page: z.number().optional().default(1),
        })
        .strict(),
      response: {
        "2xx": z
          .object({
            appointments: z.array(ZAppointment).optional(),
            pagination: z.object({
              page: z.number().optional(),
              resultats_par_page: z.number(),
              nombre_de_page: z.number().optional(),
              total: z.number().optional(),
            }),
          })
          .strict(),
      },
      securityScheme: {
        auth: "jwt-rdv-admin",
        role: "admin",
      },
    },
    "/api/admin/appointments/details": {
      querystring: z
        .object({
          query: z.string().nullish(),
          limit: z.number().optional().default(50),
          page: z.number().optional().default(1),
        })
        .strict(),
      response: {
        "2xx": z
          .object({
            appointments: z.array(ZAppointment).optional(),
            pagination: z.object({
              page: z.number().optional(),
              resultats_par_page: z.number(),
              nombre_de_page: z.number().optional(),
              total: z.number().optional(),
            }),
          })
          .strict(),
      },
      securityScheme: {
        auth: "jwt-rdv-admin",
        role: "admin",
      },
    },
  },
} as const satisfies IRoutesDef
