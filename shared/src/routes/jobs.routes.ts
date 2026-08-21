import { LBA_ITEM_TYPE } from "../constants/lbaitem.js"
import { extensions } from "../helpers/zod-helpers/zod-primitives.js"
import { z } from "../helpers/zod-with-open-api.js"
import { zObjectId } from "../models/common.js"
import { ZLbaItemLbaCompany, ZLbaItemPartnerJob } from "../models/lba-item.model.js"
import type { IRoutesDef } from "./common.routes.js"

export const zV1JobsRoutes = {
  get: {
    "/_private/jobs/:source/:id": {
      method: "get",
      path: "/_private/jobs/:source/:id",
      params: z.strictObject({
        source: extensions.buildEnum(LBA_ITEM_TYPE),
        id: z.string(),
      }),
      response: {
        "200": z.union([ZLbaItemLbaCompany, ZLbaItemPartnerJob]).nullable(),
      },
      securityScheme: null,
    },
  },
  post: {
    "/v1/jobs/matcha/:id/stats/view-details": {
      method: "post",
      path: "/v1/jobs/matcha/:id/stats/view-details",
      params: z.strictObject({
        id: zObjectId,
      }),
      response: {
        "200": z.strictObject({}),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
