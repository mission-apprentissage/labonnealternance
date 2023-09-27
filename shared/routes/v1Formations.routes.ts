import { z } from "zod"

import { ZLbacError } from "../models/lbacError.model"
import { ZLbaItem } from "../models/lbaItem.model"

import { IRoutesDef, ZResError } from "./common.routes"

export const zV1FormationsRoutes = {
  get: {
    "/api/v1/formations": {
      // TODO_SECURITY_FIX vérifier ce qu'on fait des emails et des téléphones et modifier les modèles en conséquences
      querystring: z
        .object({
          romes: z.string().optional(),
          romeDomain: z.string().optional(),
          caller: z.string().optional(),
          latitude: z.coerce.number().optional(),
          longitude: z.coerce.number().optional(),
          radius: z.coerce.number().optional(),
          diploma: z.string().optional(),
          options: z.string().optional(),
        })
        .strict(),
      headers: z
        .object({
          referer: z.string().optional(),
        })
        .strip(),
      response: {
        "200": z
          .object({
            results: z.array(ZLbaItem),
          })
          .strict(),
        "400": z.union([ZResError, ZLbacError]),
        "500": z.union([ZResError, ZLbacError]),
      },
      securityScheme: {
        auth: "none",
        role: "all",
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
          id: z.string(),
        })
        .strict(),
      response: {
        "200": z
          .object({
            results: z.array(ZLbaItem),
          })
          .strict(),
        "400": z.union([ZResError, ZLbacError]),
        "404": z.union([ZResError, ZLbacError]),
        "500": z.union([ZResError, ZLbacError]),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/v1/formations/formationDescription/:id": {
      params: z
        .object({
          id: z.string(),
        })
        .strict(),
      response: {
        "200": z
          .object({
            organisme: z
              .object({
                contact: z
                  .object({
                    tel: z.string().nullish(),
                    url: z.string().nullish(),
                  })
                  .strip(),
              })
              .strip(),
          })
          .strip(),
        "400": z.union([ZResError, ZLbacError]),
        "404": z.union([ZResError, ZLbacError]),
        "500": z.union([ZResError, ZLbacError]),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
} as const satisfies IRoutesDef
