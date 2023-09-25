import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"
import { zObjectId } from "../models/common"
import {
  ZEligibleTrainingsForAppointmentSchema,
} from "../models/elligibleTraining.model"

import { IRoutesDef } from "./common.routes"

export const zEligibleTrainingsForAppointmentRoutes = {
  get: {
    "/api/admin/eligible-trainings-for-appointment/etablissement-formateur-siret/:siret": {
      params: z.object({ siret: extensions.siret() }).strict(),
      response: {
        "200": ZEligibleTrainingsForAppointmentSchema
      },
    },
    "/api/admin/eligible-trainings-for-appointment/:id": {
      params: z.object({ id: zObjectId }).strict(),
      response: {
        "200": ZEligibleTrainingsForAppointmentSchema
      },
    },
  },
  put: {
    "/api/admin/eligible-trainings-for-appointment/:id": {
      params: z.object({ id: zObjectId }).strict(),
      response: {
        "200": ZEligibleTrainingsForAppointmentSchema
      },
    },
  },
  patch: {
    "/api/admin/eligible-trainings-for-appointment/:id": {
      params: z.object({ id: zObjectId }).strict(),
      response: {
        "200": ZEligibleTrainingsForAppointmentSchema
      },
    },
  }
} as const satisfies IRoutesDef
