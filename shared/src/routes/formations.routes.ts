import { z } from "../helpers/zodWithOpenApi.js"
import { zFormationCatalogueSchema } from "../models/formation.model.js"
import { ZLbacError } from "../models/lbacError.model.js"
import { ZLbaItemFormation, ZLbaItemFormation2, ZLbaItemFormationResult } from "../models/lbaItem.model.js"

import { ZLatitudeParam, ZLongitudeParam, ZRadiusParam, zCallerParam, zDiplomaParam, zGetFormationOptions, zRefererHeaders, zRomesParams } from "./_params.js"
import type { IRoutesDef } from "./common.routes.js"
import { ZResError } from "./common.routes.js"

export const zFormationsRoutes = {
  get: {
    "/admin/formations": {
      method: "get",
      path: "/admin/formations",
      querystring: z.object({ search_item: z.string() }).strict(),
      response: {
        "200": z.array(zFormationCatalogueSchema),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {
          formationCatalogue: [
            {
              cle_ministere_educatif: { type: "query", key: "search_item" },
            },
          ],
        },
      },
    },
    "/v1/formations": {
      method: "get",
      path: "/v1/formations",
      querystring: z
        .object({
          romes: zRomesParams("romeDomain"),
          romeDomain: z.string().optional(),
          latitude: ZLatitudeParam,
          longitude: ZLongitudeParam,
          radius: ZRadiusParam.default(30),
          diploma: zDiplomaParam,
          caller: zCallerParam.optional(),
          options: zGetFormationOptions,
        })
        .strict()
        .passthrough(),
      headers: zRefererHeaders,
      response: {
        "200": ZLbaItemFormationResult,
        "400": z.union([ZResError, ZLbacError]),
        "500": z.union([ZResError, ZLbacError]),
      },
      securityScheme: null,
    },
    "/v1/_private/formations/min": {
      method: "get",
      path: "/v1/_private/formations/min",
      querystring: z.object({
        romes: zRomesParams("romeDomain"),
        latitude: ZLatitudeParam,
        longitude: ZLongitudeParam,
        radius: ZRadiusParam.default(30),
        diploma: zDiplomaParam,
      }),
      headers: zRefererHeaders,
      response: {
        "200": ZLbaItemFormation.array(),
      },
      securityScheme: null,
    },
    "/v1/formations/formation/:id": {
      method: "get",
      path: "/v1/formations/formation/:id",
      querystring: z
        .object({
          caller: zCallerParam,
        })
        .strict(),
      params: z
        .object({
          id: z.string(),
        })
        .strict(),
      response: {
        "200": ZLbaItemFormationResult,
        "400": z.union([ZResError, ZLbacError]),
        "404": z.union([ZResError, ZLbacError]),
        "500": z.union([ZResError, ZLbacError]),
      },
      securityScheme: null,
    },
    "/_private/formations/:id": {
      method: "get",
      path: "/_private/formations/:id",
      params: z
        .object({
          id: z.string(),
        })
        .strict(),
      response: {
        "200": ZLbaItemFormation2,
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
