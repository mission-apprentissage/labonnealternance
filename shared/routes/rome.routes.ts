import { z } from "zod"

import { ZRomeDetail } from "../models/rome.model"

import { IRoutesDef } from "./common.routes"

const ZRomeWithLabel = z
  .object({
    codeRome: z.string(),
    intitule: z.string(),
  })
  .strict()
const ZMetierEnrichi = z
  .object({
    label: z.string(),
    romes: z.array(z.string()),
    rncps: z.array(z.string()).optional(),
    type: z.string().optional(),
    romeTitles: z.array(ZRomeWithLabel).optional(),
  })
  .strict()
const ZMetiersEnrichis = z
  .object({
    labelsAndRomes: z.array(ZMetierEnrichi).optional(),
    labelsAndRomesForDiplomas: z.array(ZMetierEnrichi).optional(),
    error: z.string().optional(),
    error_messages: z.array(z.string()).optional(),
  })
  .strict()

export const zRomeRoutes = {
  get: {
    "/api/rome": {
      response: {
        "200": ZMetiersEnrichis,
      },
    },
    "/api/rome/detail/:rome": {
      params: z.object({
        rome: z.string(),
      }),
      response: {
        "200": ZRomeDetail,
      },
    },
  },
} satisfies IRoutesDef
