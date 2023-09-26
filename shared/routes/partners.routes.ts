import { ZEligibleTrainingsForAppointmentSchema } from "shared/models/elligibleTraining.model"

import { z } from "../helpers/zodWithOpenApi"

import { IRoutesDef } from "./common.routes"

export const zPartnersRoutes = {
  get: {
    "/api/partners/parcoursup/formations": {
      response: {
        "200": z.object({ ids: z.array(ZEligibleTrainingsForAppointmentSchema.shape.parcoursup_id) }),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
} as const satisfies IRoutesDef
