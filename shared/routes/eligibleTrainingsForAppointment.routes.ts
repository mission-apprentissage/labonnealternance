import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"
import { zObjectId } from "../models/common"
import { ZEligibleTrainingsForAppointmentSchema } from "../models/elligibleTraining.model"

import { IRoutesDef } from "./common.routes"

export const zEligibleTrainingsForAppointmentRoutes = {
  get: {
    "/api/admin/eligible-trainings-for-appointment/etablissement-formateur-siret/:siret": {
      params: z.object({ siret: extensions.siret() }).strict(),
      response: {
        "200": z.object({ parameters: z.array(ZEligibleTrainingsForAppointmentSchema) }),
      },
      securityScheme: {
        auth: "jwt-rdv-admin",
        role: "admin",
      },
    },
  },
  patch: {
    "/api/admin/eligible-trainings-for-appointment/:id": {
      params: z.object({ id: zObjectId }).strict(),
      body: ZEligibleTrainingsForAppointmentSchema,
      response: {
        "200": z.union([ZEligibleTrainingsForAppointmentSchema, z.null()]),
      },
      securityScheme: {
        auth: "jwt-rdv-admin",
        role: "admin",
      },
    },
  },
} as const satisfies IRoutesDef
