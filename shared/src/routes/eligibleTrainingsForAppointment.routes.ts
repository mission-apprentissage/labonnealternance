import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"
import { zObjectId } from "../models/common.js"
import { ZEligibleTrainingsForAppointmentSchema, ZETFAParameters } from "../models/elligibleTraining.model.js"

import { IRoutesDef } from "./common.routes.js"

export const zEligibleTrainingsForAppointmentRoutes = {
  get: {
    "/admin/eligible-trainings-for-appointment/etablissement-formateur-siret/:siret": {
      method: "get",
      path: "/admin/eligible-trainings-for-appointment/etablissement-formateur-siret/:siret",
      params: z.object({ siret: extensions.siret }).strict(),
      response: {
        "200": ZETFAParameters,
      },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {},
      },
    },
  },
  patch: {
    "/admin/eligible-trainings-for-appointment/:id": {
      method: "patch",
      path: "/admin/eligible-trainings-for-appointment/:id",
      params: z.object({ id: zObjectId }).strict(),
      body: z.union([
        ZEligibleTrainingsForAppointmentSchema.pick({
          is_lieu_formation_email_customized: true,
          cle_ministere_educatif: true,
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
        auth: "cookie-session",
        access: "admin",
        resources: {},
      },
    },
  },
} as const satisfies IRoutesDef
