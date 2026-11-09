import { extensions } from "../helpers/zod-helpers/zod-primitives.js"
import { z } from "../helpers/zod-with-open-api.js"
import { zObjectId } from "../models/common.js"
import { RGPD_ERASURE_MODE, RGPD_ERASURE_STATUS, RGPD_USER_TYPE, ZRgpdErasureFailure, ZRgpdErasureStep } from "../models/rgpd-erasure.model.js"

import type { IRoutesDef } from "./common.routes.js"

const rgpdErasureAccess = { auth: "cookie-session", access: "admin", resources: {} } as const

// E-mail dans le corps et jamais dans l'URL : createAccessLog journalise les params de chaque appel.
const ZRgpdTarget = z.strictObject({
  user_type: extensions.buildEnum(RGPD_USER_TYPE),
  email: z.string().trim().min(3).max(320),
  mode: extensions.buildEnum(RGPD_ERASURE_MODE),
})

export const ZRgpdErasurePreview = z.strictObject({
  found: z.boolean().describe("Un utilisateur du type demandé correspond à l'e-mail"),
  other_user_types: z.array(extensions.buildEnum(RGPD_USER_TYPE)).describe("Autres types sous lesquels l'e-mail existe"),
  steps: z.array(ZRgpdErasureStep),
  warnings: z.array(z.string()),
})
export type IRgpdErasurePreview = z.output<typeof ZRgpdErasurePreview>

export const ZRgpdErasureReport = z.strictObject({
  audit_id: zObjectId,
  status: extensions.buildEnum(RGPD_ERASURE_STATUS),
  steps: z.array(ZRgpdErasureStep),
  failures: z.array(ZRgpdErasureFailure),
  warnings: z.array(z.string()),
})
export type IRgpdErasureReport = z.output<typeof ZRgpdErasureReport>

export const zRgpdErasureRoutes = {
  post: {
    "/admin/rgpd/preview": {
      method: "post",
      path: "/admin/rgpd/preview",
      body: ZRgpdTarget,
      response: { "200": ZRgpdErasurePreview },
      securityScheme: rgpdErasureAccess,
    },
    "/admin/rgpd/erase": {
      method: "post",
      path: "/admin/rgpd/erase",
      body: ZRgpdTarget.extend({
        request_ref: z.string().trim().max(200).nullable(),
      }),
      response: { "200": ZRgpdErasureReport },
      securityScheme: rgpdErasureAccess,
    },
  },
} as const satisfies IRoutesDef
