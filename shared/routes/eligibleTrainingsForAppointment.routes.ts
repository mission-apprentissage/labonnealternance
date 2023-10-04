import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"
import { zObjectId } from "../models/common"
import { ZEligibleTrainingsForAppointmentSchema } from "../models/elligibleTraining.model"

import { IRoutesDef } from "./common.routes"

export const zEligibleTrainingsForAppointmentRoutes = {
  get: {
    "/admin/eligible-trainings-for-appointment/etablissement-formateur-siret/:siret": {
      params: z.object({ siret: extensions.siret() }).strict(),
      response: {
        "200": z.object({ parameters: z.array(ZEligibleTrainingsForAppointmentSchema) }).strict(),
      },
      securityScheme: {
        auth: "jwt-rdv-admin",
        role: "administrator",
      },
    },
  },
  patch: {
    "/admin/eligible-trainings-for-appointment/:id": {
      params: z.object({ id: zObjectId }).strict(),
      body: z.union([
          ZEligibleTrainingsForAppointmentSchema.pick({
            is_lieu_formation_email_customized: true,
            lieu_formation_email: true,
          }),
          ZEligibleTrainingsForAppointmentSchema.pick({
            is_lieu_formation_email_customized: true,
          }),
          ZEligibleTrainingsForAppointmentSchema.pick({
            referrers: true,
          }),
        ]),
      response: {
        "200": z.union([ZEligibleTrainingsForAppointmentSchema, z.null()]),
      },
      securityScheme: {
        auth: "jwt-rdv-admin",
        role: "administrator",
      },
    },
  },
} as const satisfies IRoutesDef
