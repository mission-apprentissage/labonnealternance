import { LBA_ITEM_TYPE } from "../constants/lbaitem.js"
import { z } from "../helpers/zod-with-open-api.js"
import { extensions } from "../helpers/zodHelpers/zod-primitives.js"
import { zObjectId } from "../models/common.js"
import { ZLbaItemLbaCompany, ZLbaItemLbaJob, ZLbaItemPartnerJob } from "../models/lba-item.model.js"
import { ZApiError, ZLbacError } from "../models/lbac-error.model.js"

import { ZLatitudeParam, ZLongitudeParam, ZRadiusParam, zCallerParam, zDiplomaParam, zInseeParams, zOpcoParams, zRefererHeaders, zRncpsParams, zRomesParams } from "./_params.js"
import type { IRoutesDef } from "./common.routes.js"
import { ZResError } from "./common.routes.js"

export const zV1JobsRoutes = {
  get: {
    "/v1/_private/jobs/min": {
      method: "get",
      path: "/v1/_private/jobs/min",
      querystring: z
        .strictObject({
          romes: zRomesParams("rncp"),
          rncp: zRncpsParams,
          caller: zCallerParam.nullish(),
          latitude: ZLatitudeParam,
          longitude: ZLongitudeParam,
          radius: ZRadiusParam,
          insee: zInseeParams,
          diploma: zDiplomaParam,
          opco: zOpcoParams,
          elligibleHandicapFilter: z.enum(["true", "false"]).optional(),
        })
        .passthrough(),
      headers: zRefererHeaders,
      response: {
        "200": z.strictObject({
          partnerJobs: z.union([
            z
              .strictObject({
                results: z.array(ZLbaItemPartnerJob),
              })
              .nullable(),
            ZApiError,
          ]),
          lbaJobs: z.union([
            z
              .strictObject({
                results: z.array(ZLbaItemPartnerJob),
              })
              .nullable(),
            ZApiError,
          ]),
          lbaCompanies: z.union([
            z
              .strictObject({
                results: z.array(ZLbaItemLbaCompany),
              })
              .nullable(),
            ZApiError,
          ]),
        }),
        "400": z.union([ZResError, ZLbacError, ZApiError]),
        "500": z.union([ZResError, ZLbacError, ZApiError]),
      },
      securityScheme: null,
    },
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
