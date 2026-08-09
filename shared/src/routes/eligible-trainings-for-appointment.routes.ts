import { extensions } from "../helpers/zod-helpers/zod-primitives.js"
import { z } from "../helpers/zod-with-open-api.js"
import { zObjectId } from "../models/common.js"
import { ZEligibleTrainingsForAppointmentSchema, ZETFAParameters } from "../models/elligible-training.model.js"

import type { IRoutesDef } from "./common.routes.js"

export const zEligibleTrainingsForAppointmentRoutes = {
  get: {
    "/admin/eligible-trainings-for-appointment/etablissement-formateur-siret/:siret": {
      method: "get",
      path: "/admin/eligible-trainings-for-appointment/etablissement-formateur-siret/:siret",
      params: z.strictObject({ siret: extensions.siret }),
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
      params: z.strictObject({ id: zObjectId }),
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
