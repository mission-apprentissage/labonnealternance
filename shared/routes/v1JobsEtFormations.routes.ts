import { z } from "zod"

import { ZApiError, ZLbacError } from "../models/lbacError.model"
import { ZLbaItemFormation, ZLbaItemLbaCompany, ZLbaItemLbaJob, ZLbaItemPeJob } from "../models/lbaItem.model"

import { IRoutesDef, ZResError } from "./common.routes"

export const zV1JobsEtFormationsRoutes = {
  get: {
    "/api/v1/jobsEtFormations": {
      querystring: z
        .object({
          romes: z.string().optional(),
          rncp: z.string().optional(),
          caller: z.string().optional(),
          latitude: z.coerce.number().optional(),
          longitude: z.coerce.number().optional(),
          radius: z.coerce.number().optional(),
          insee: z.string().optional(),
          sources: z.string().optional(),
          diploma: z.string().optional(),
          opco: z.string().optional(),
          opcoUrl: z.string().optional(),
          options: z.string().optional(), // hidden
        })
        .strict(),
      headers: z
        .object({
          referer: z.string().optional(),
        })
        .strict(),
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
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
} as const satisfies IRoutesDef
