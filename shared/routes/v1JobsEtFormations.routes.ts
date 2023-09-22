import { z } from "zod"

import { ZLbaItem } from "../models/lbaItem.model"

export const zV1JobsEtFormationsRoutes = {
  get: {
    "/api/v1/jobsEtFormations": {
      queryString: z
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
      response: {
        "200": z
          .object({
            formations: z
              .object({
                results: z.array(ZLbaItem),
              })
              .strict()
              .or(z.null()),
            jobs: z
              .object({
                peJobs: z
                  .object({
                    results: z.array(ZLbaItem),
                  })
                  .strict()
                  .nullable(),
                matchas: z
                  .object({
                    results: z.array(ZLbaItem),
                  })
                  .strict()
                  .nullable(),
                lbaCompanies: z
                  .object({
                    results: z.array(ZLbaItem),
                  })
                  .strict()
                  .nullable(),
                lbbCompanies: z.null(), // always null ???
              })
              .strict()
              .or(z.null()),
          })
          .strict(),
      },
    },
  },
  post: {},
  put: {},
  delete: {},
}
