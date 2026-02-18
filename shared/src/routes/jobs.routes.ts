import { zObjectId } from "zod-mongodb-schema"

import { LBA_ITEM_TYPE } from "../constants/lbaitem.js"
import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"
import { ZApiError, ZLbacError } from "../models/lbacError.model.js"
import { ZLbaItemLbaCompany, ZLbaItemLbaJob, ZLbaItemPartnerJob } from "../models/lbaItem.model.js"

import { zCallerParam, zDiplomaParam, zInseeParams, ZLatitudeParam, ZLongitudeParam, zOpcoParams, ZRadiusParam, zRefererHeaders, zRncpsParams, zRomesParams } from "./_params.js"
import type { IRoutesDef } from "./common.routes.js"
import { ZResError } from "./common.routes.js"

export const zV1JobsRoutes = {
  get: {
    "/v1/_private/jobs/min": {
      method: "get",
      path: "/v1/_private/jobs/min",
      querystring: z
        .object({
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
        .strict()
        .passthrough(),
      headers: zRefererHeaders,
      response: {
        "200": z
          .object({
            partnerJobs: z.union([
              z
                .object({
                  results: z.array(ZLbaItemPartnerJob),
                })
                .strict()
                .nullable(),
              ZApiError,
            ]),
            lbaJobs: z.union([
              z
                .object({
                  results: z.array(ZLbaItemPartnerJob),
                })
                .strict()
                .nullable(),
              ZApiError,
            ]),
            lbaCompanies: z.union([
              z
                .object({
                  results: z.array(ZLbaItemLbaCompany),
                })
                .strict()
                .nullable(),
              ZApiError,
            ]),
          })
          .strict(),
        "400": z.union([ZResError, ZLbacError, ZApiError]),
        "500": z.union([ZResError, ZLbacError, ZApiError]),
      },
      securityScheme: null,
    },
    "/_private/jobs/:source/:id": {
      method: "get",
      path: "/_private/jobs/:source/:id",
      params: z
        .object({
          source: extensions.buildEnum(LBA_ITEM_TYPE),
          id: z.string(),
        })
        .strict(),
      response: {
        "200": z.union([ZLbaItemLbaJob, ZLbaItemLbaCompany, ZLbaItemPartnerJob]).nullable(),
      },
      securityScheme: null,
    },
  },
  post: {
    "/v1/jobs/matcha/:id/stats/view-details": {
      method: "post",
      path: "/v1/jobs/matcha/:id/stats/view-details",
      params: z
        .object({
          id: zObjectId,
        })
        .strict(),
      response: {
        "200": z.object({}).strict(),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
