import { ZEligibleTrainingsForAppointmentSchema } from "shared/models/elligibleTraining.model"

import { z } from "../helpers/zodWithOpenApi"

import { IRoutesDef } from "./common.routes"

export const zPartnersRoutes = {
  get: {
    "/api/partners/parcoursup/formations": {
      response: {
        "200": z.array(z.object({ parcoursup_id: ZEligibleTrainingsForAppointmentSchema.shape.parcoursup_id })),
      },
    },
  },
} as const satisfies IRoutesDef
