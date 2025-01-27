import { ZEligibleTrainingsForAppointmentSchema } from "shared/models/elligibleTraining.model.js"

import { z } from "../helpers/zodWithOpenApi.js"

import { IRoutesDef } from "./common.routes.js"

export const zPartnersRoutes = {
  get: {
    "/partners/parcoursup/formations": {
      method: "get",
      path: "/partners/parcoursup/formations",
      response: {
        "200": z.object({ ids: z.array(ZEligibleTrainingsForAppointmentSchema.shape.parcoursup_id) }).strict(),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
