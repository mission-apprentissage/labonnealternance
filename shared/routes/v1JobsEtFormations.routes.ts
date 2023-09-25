import { z } from "zod"

import { ZLbacError } from "../models/lbacError.model"
import { ZLbaItem } from "../models/lbaItem.model"

import { IRoutesDef, ZResError } from "./common.routes"

export const zV1JobsEtFormationsRoutes = {
  get: {
    "/api/v1/jobsEtFormations": {
      querystring: z
        .object({
          romes: z.string().optional(),
          rncp: z.string().optional(),
          caller: z.string().optional(),
          latitude: z.string().optional(),
          longitude: z.string().optional(),
          radius: z.string().optional(),
          insee: z.string().optional(),
          sources: z.string().optional(),
          diploma: z.string().optional(),
          opco: z.string().optional(),
          opcoUrl: z.string().optional(),
          options: z.string().optional(), // hidden
          useMock: z.string().optional(), // hidden
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
            formations: z
              .object({
                results: z.array(ZLbaItem),
              })
              .strict()
              .or(ZLbacError)
              .or(z.null()),
            jobs: z
              .object({
                peJobs: z
                  .object({
                    results: z.array(ZLbaItem),
                  })
                  .strict()
                  .or(ZLbacError)
                  .nullable(),
                matchas: z
                  .object({
                    results: z.array(ZLbaItem),
                  })
                  .strict()
                  .or(ZLbacError)
                  .nullable(),
                lbaCompanies: z
                  .object({
                    results: z.array(ZLbaItem),
                  })
                  .strict()
                  .or(ZLbacError)
                  .nullable(),
                lbbCompanies: z.null(), // always null until removal
              })
              .strict()
              .or(z.null()),
          })
          .strict(),
        "400": z.union([ZResError, ZLbacError.strict()]),
        "500": z.union([ZResError, ZLbacError.strict()]),
      },
    },
  },
} as const satisfies IRoutesDef
