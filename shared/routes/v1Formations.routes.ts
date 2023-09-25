import { z } from "zod"

import { ZLbacError } from "../models/lbacError.model"
import { ZLbaItem } from "../models/lbaItem.model"

import { IRoutesDef } from "./common.routes"

export const zV1FormationsRoutes = {
  get: {
    "/api/v1/formations": {
      querystring: z
        .object({
          romes: z.string().optional(),
          romeDomain: z.string().optional(),
          caller: z.string().optional(),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
          radius: z.number().optional(),
          diploma: z.string().optional(),
          options: z.string().optional(),
          useMock: z.string().optional(),
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
            results: z.array(ZLbaItem),
          })
          .strict(),
        "400": ZLbacError,
        "500": ZLbacError,
      },
    },
    "/api/v1/formations/formation/:id": {
      querystring: z
        .object({
          caller: z.string().optional(),
        })
        .strict(),
      params: z
        .object({
          id: z.string().optional(),
        })
        .strict(),
      response: {
        "200": z
          .object({
            results: z.array(ZLbaItem),
          })
          .strict(),
        "400": ZLbacError,
        "404": ZLbacError,
        "500": ZLbacError,
      },
    },
    "/api/v1/formations/formationDescription/:id": {
      params: z
        .object({
          id: z.string().optional(),
        })
        .strict(),
      response: {
        "200": z
          .object({
            results: z.array(ZLbaItem),
          })
          .strict(),
        "400": ZLbacError,
        "404": ZLbacError,
        "500": ZLbacError,
      },
    },
  },
} satisfies IRoutesDef
