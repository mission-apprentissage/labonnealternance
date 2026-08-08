import { z } from "../helpers/zod-with-open-api.js"
import { zFormationCatalogueSchema } from "../models/formation.model.js"
import { ZLbaItemFormation, ZLbaItemFormation2, ZLbaItemFormationResult } from "../models/lba-item.model.js"
import { ZLbacError } from "../models/lbac-error.model.js"
import type { IRoutesDef } from "./common.routes.js"
import { ZResError } from "./common.routes.js"
import { ZLatitudeParam, ZLongitudeParam, ZRadiusParam, zCallerParam, zDiplomaParam, zGetFormationOptions, zRefererHeaders, zRomesParams } from "./params.js"

export const zFormationsRoutes = {
  get: {
    "/admin/formations": {
      method: "get",
      path: "/admin/formations",
      querystring: z.strictObject({ search_item: z.string() }),
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
        .strictObject({
          romes: zRomesParams("romeDomain"),
          romeDomain: z.string().optional(),
          latitude: ZLatitudeParam,
          longitude: ZLongitudeParam,
          radius: ZRadiusParam.default(30),
          diploma: zDiplomaParam,
          caller: zCallerParam.optional(),
          options: zGetFormationOptions,
        })
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
      querystring: z.strictObject({
        caller: zCallerParam,
      }),
      params: z.strictObject({
        id: z.string(),
      }),
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
      params: z.strictObject({
        id: z.string(),
      }),
      response: {
        "200": ZLbaItemFormation2,
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
