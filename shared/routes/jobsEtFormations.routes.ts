import { z } from "../helpers/zodWithOpenApi.js"
import { ZApiError, ZLbacError } from "../models/lbacError.model.js"
import { ZLbaItemFormation, ZLbaItemFtJob, ZLbaItemLbaCompany, ZLbaItemLbaJob, ZLbaItemPartnerJob } from "../models/lbaItem.model.js"
import { rateLimitDescription } from "../utils/rateLimitDescription.js"

import {
  zCallerParam,
  zDiplomaParam,
  zInseeParams,
  ZLatitudeParam,
  ZLongitudeParam,
  zOpcoParams,
  zOpcoUrlParams,
  ZRadiusParam,
  zRefererHeaders,
  zRncpsParams,
  zRomesParams,
  zSourcesParams,
} from "./_params.js"
import { IRoutesDef, ZResError } from "./common.routes.js"

export const zV1JobsEtFormationsRoutes = {
  get: {
    "/v1/jobsEtFormations": {
      method: "get",
      path: "/v1/jobsEtFormations",
      querystring: z
        .object({
          romes: zRomesParams("rncp"),
          rncp: zRncpsParams,
          caller: zCallerParam,
          latitude: ZLatitudeParam,
          longitude: ZLongitudeParam,
          radius: ZRadiusParam,
          insee: zInseeParams,
          sources: zSourcesParams,
          diploma: zDiplomaParam,
          opco: zOpcoParams,
          opcoUrl: zOpcoUrlParams,
          options: z.literal("with_description").optional(), // hidden
        })
        .strict()
        .passthrough(),
      headers: zRefererHeaders,
      response: {
        "200": z
          .object({
            formations: z.union([
              z
                .object({
                  results: z.array(ZLbaItemFormation),
                })
                .strict(),
              ZApiError,
              z.null(),
            ]),
            jobs: z
              .object({
                peJobs: z.union([
                  z
                    .object({
                      results: z.array(ZLbaItemFtJob),
                    })
                    .strict(),
                  ZApiError,
                  z.null(),
                ]),
                matchas: z.union([
                  z
                    .object({
                      results: z.array(ZLbaItemLbaJob),
                    })
                    .strict(),
                  ZApiError,
                  z.null(),
                ]),
                lbaCompanies: z.union([
                  z
                    .object({
                      results: z.array(ZLbaItemLbaCompany),
                    })
                    .strict(),
                  ZApiError,
                  z.null(),
                ]),
                lbbCompanies: z.null(), // always null until removal
                partnerJobs: z.union([
                  z
                    .object({
                      results: z.array(ZLbaItemPartnerJob),
                    })
                    .strict(),
                  ZApiError,
                  z.null(),
                ]),
              })
              .strict()
              .or(ZApiError)
              .or(z.null()),
          })
          .strict(),
        "400": z.union([ZResError, ZLbacError.strict()]),
        "500": z.union([ZResError, ZLbacError.strict()]),
      },
      securityScheme: null,
      openapi: {
        tags: ["V1 - Jobs et formations"] as string[],
        description: `${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
      },
    },
  },
} as const satisfies IRoutesDef
