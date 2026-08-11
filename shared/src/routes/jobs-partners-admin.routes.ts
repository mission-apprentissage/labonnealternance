import { extensions } from "../helpers/zod-helpers/zod-primitives.js"
import { z } from "../helpers/zod-with-open-api.js"
import { zObjectId } from "../models/common.js"
import { JOB_STATUS_ENGLISH } from "../models/job.model.js"
import { ZJobsPartnersOfferForAdmin } from "../models/jobs-partners.model.js"

import type { IRoutesDef } from "./common.routes.js"

export const zJobsPartnersAdminRoutes = {
  get: {
    "/admin/jobs-partners": {
      method: "get",
      path: "/admin/jobs-partners",
      querystring: z.object({
        partner_label: z
          .union([z.string(), z.array(z.string())])
          .transform((v) => (Array.isArray(v) ? v : [v]))
          .optional(),
        offer_status: z
          .union([extensions.buildEnum(JOB_STATUS_ENGLISH), z.array(extensions.buildEnum(JOB_STATUS_ENGLISH))])
          .transform((v) => (Array.isArray(v) ? v : [v]))
          .optional(),
        id: z.string().optional(),
        limit: z.coerce.number<number>().int().min(1).max(100).optional(),
        offset: z.coerce.number<number>().int().min(0).optional(),
      }),
      response: {
        "200": z.strictObject({
          jobs: z.array(ZJobsPartnersOfferForAdmin),
          pagination: z.strictObject({
            total: z.number(),
            limit: z.number(),
            offset: z.number(),
          }),
        }),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {},
      },
    },
  },
  post: {
    "/admin/jobs-partners/:id/activate": {
      method: "post",
      path: "/admin/jobs-partners/:id/activate",
      params: z.strictObject({ id: zObjectId }),
      response: {
        "200": z.strictObject({}),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {},
      },
    },
    "/admin/jobs-partners/:id/deactivate": {
      method: "post",
      path: "/admin/jobs-partners/:id/deactivate",
      params: z.strictObject({ id: zObjectId }),
      body: z.strictObject({
        reason: z.string().min(1, "La raison est obligatoire"),
      }),
      response: {
        "200": z.strictObject({}),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {},
      },
    },
    "/admin/jobs-partners/:id/classification": {
      method: "post",
      path: "/admin/jobs-partners/:id/classification",
      params: z.strictObject({ id: zObjectId }),
      body: z.strictObject({
        classification: z.enum(["publish", "unpublish"]),
      }),
      response: {
        "200": z.strictObject({ updated: z.boolean() }),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {},
      },
    },
  },
} as const satisfies IRoutesDef
