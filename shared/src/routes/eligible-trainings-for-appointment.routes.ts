import { extensions } from "../helpers/zod-helpers/zod-primitives.js"
import { z } from "../helpers/zod-with-open-api.js"
import { zObjectId } from "../models/common.js"
import { ZEligibleTrainingsForAppointmentSchema, ZETFAParameters, ZReferrerName } from "../models/elligible-training.model.js"

import type { IRoutesDef } from "./common.routes.js"

const ZETFABulkOperation = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("set_email"), email: z.email() }),
  z.strictObject({ type: z.literal("reset_email") }),
  z.strictObject({
    type: z.literal("set_referrers"),
    // auto : retire le forçage, la plateforme suit de nouveau l'opt-out et le premium
    changes: z.array(z.strictObject({ referrer: ZReferrerName, mode: z.enum(["auto", "on", "off"]) })).min(1),
  }),
])
export type IETFABulkOperation = z.output<typeof ZETFABulkOperation>

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
    "/admin/eligible-trainings-for-appointment": {
      method: "patch",
      path: "/admin/eligible-trainings-for-appointment",
      body: z.strictObject({
        ids: z.array(zObjectId).min(1).max(1000),
        operation: ZETFABulkOperation,
      }),
      response: {
        // skipped : forçages demandés sur une plateforme non éligible, ignorés
        "200": z.strictObject({ updated: z.number(), skipped: z.number() }),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {},
      },
    },
    "/admin/eligible-trainings-for-appointment/:id": {
      method: "patch",
      path: "/admin/eligible-trainings-for-appointment/:id",
      params: z.strictObject({ id: zObjectId }),
      body: ZEligibleTrainingsForAppointmentSchema.pick({
        is_lieu_formation_email_customized: true,
        cle_ministere_educatif: true,
        lieu_formation_email: true,
      }),
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
