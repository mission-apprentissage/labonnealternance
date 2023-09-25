import { z } from "../helpers/zodWithOpenApi"
import {
  ZEligibleTrainingsForAppointmentSchema,
} from "../models/elligibleTraining.model"

import { IRoutesDef } from "./common.routes"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"

export const zEligibleTrainingsForAppointmentRoutes = {
  get: {
    "/api/admin/eligible-trainings-for-appointment/etablissement-formateur-siret/:siret": {
      params: z.object({ siret: extensions.siret() }).strict(),
      response: {
        "200": ZEligibleTrainingsForAppointmentSchema
      },
    },
    "/api/admin/eligible-trainings-for-appointment/:id": {
      params: z.object({ id: z.string() }).strict(),
      response: {
        "200": ZEligibleTrainingsForAppointmentSchema
      },
    },
  },
  put: {
    "/api/admin/eligible-trainings-for-appointment/:id": {
      params: z.object({ id: z.string() }).strict(),
      response: {
        "200": ZEligibleTrainingsForAppointmentSchema
      },
    },
  },
  patch: {
    "/api/admin/eligible-trainings-for-appointment/:id": {
      params: z.object({ id: z.string() }).strict(),
      response: {
        "200": ZEligibleTrainingsForAppointmentSchema
      },
    },
  }
} as const satisfies IRoutesDef
