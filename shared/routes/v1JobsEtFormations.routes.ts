import { z } from "zod"

import { ZApiError, ZLbacError } from "../models/lbacError.model"
import { ZLbaItemFormation, ZLbaItemLbaCompany, ZLbaItemLbaJob, ZLbaItemPeJob } from "../models/lbaItem.model"

import { zCallerParam, zRefererHeaders, zRomesParams } from "./_params"
import { IRoutesDef, ZResError } from "./common.routes"

export const zV1JobsEtFormationsRoutes = {
  get: {
    "/v1/jobsEtFormations": {
      querystring: z
        .object({
          romes: zRomesParams("rncp"),
          rncp: z
            .string()
            .optional()
            .openapi({
              param: {
                description: "Un code RNCP. <br />rome et rncp sont incompatibles.<br /><strong>Au moins un des deux doit être renseigné.</strong>",
              },
            }),
          caller: zCallerParam,
          latitude: z.coerce
            .number()
            .optional()
            .openapi({
              param: {
                description: "search center latitude. Without latitude, the search will target whole France",
              },
            }),
          longitude: z.coerce
            .number()
            .optional()
            .openapi({
              param: {
                description: "search center longitude. Without longitude, the search will target whole France",
              },
            }),
          radius: z.coerce
            .number()
            .optional()
            .openapi({
              param: {
                description: "the search radius",
              },
            }),
          insee: z
            .string()
            .optional()
            .openapi({
              param: {
                description: "search center insee code",
              },
            }),
          sources: z
            .string()
            .optional()
            .openapi({
              param: {
                description: 'comma separated list of job opportunities sources and trainings (possible values : "formations", "lba", "matcha", "offres")',
              },
            }),
          diploma: z
            .string()
            .optional()
            .openapi({
              param: {
                description: "targeted diploma",
              },
            }),
          opco: z
            .string()
            .optional()
            .openapi({
              param: {
                description: "filter opportunities on opco name",
              },
            }),
          opcoUrl: z
            .string()
            .optional()
            .openapi({
              param: {
                description: "filter opportunities on opco url",
              },
            }),
          options: z.literal("with_description").optional(), // hidden
        })
        .strict(),
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
      securityScheme: {
        auth: "none",
        role: "all",
      },
      openapi: {
        tags: ["Jobs et formations"] as string[],
        operationId: "getJobsEtFormations",
      },
    },
  },
} as const satisfies IRoutesDef
