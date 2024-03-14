import { z } from "../helpers/zodWithOpenApi"
import { ZApiError, ZLbacError } from "../models/lbacError.model"
import { ZLbaItemFormation, ZLbaItemLbaCompany, ZLbaItemLbaJob, ZLbaItemPeJob } from "../models/lbaItem.model"

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
} from "./_params"
import { IRoutesDef, ZResError } from "./common.routes"

export const zJobsEtFormationsRoutesV2 = {
  get: {
    "/jobsEtFormations": {
      method: "get",
      path: "/jobsEtFormations",
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
                      results: z.array(ZLbaItemPeJob),
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
              })
              .strict()
              .or(ZApiError)
              .or(z.null()),
          })
          .strict(),
        "400": z.union([ZResError, ZLbacError.strict()]),
        "500": z.union([ZResError, ZLbacError.strict()]),
      },
      securityScheme: { auth: "api-key", access: null, resources: {} },
      openapi: {
        tags: ["Jobs et formations"] as string[],
        operationId: "getJobsEtFormations",
      },
    },
  },
} as const satisfies IRoutesDef
