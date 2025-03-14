import { z } from "../helpers/zodWithOpenApi.js"
import { zFormationCatalogueSchema } from "../models/formation.model.js"
import { ZLbacError } from "../models/lbacError.model.js"
import { ZLbaItemFormation2, ZLbaItemFormationResult } from "../models/lbaItem.model.js"
import { rateLimitDescription } from "../utils/rateLimitDescription.js"

import { ZLatitudeParam, ZLongitudeParam, ZRadiusParam, zCallerParam, zDiplomaParam, zGetFormationOptions, zRefererHeaders, zRomesParams } from "./_params.js"
import { IRoutesDef, ZResError } from "./common.routes.js"

export const zFormationsRoutes = {
  get: {
    "/admin/formations": {
      method: "get",
      path: "/admin/formations",
      querystring: z.object({ search_item: z.string() }).strict(),
      response: {
        "2xx": z.array(zFormationCatalogueSchema),
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
          romeDomain: z
            .string()
            .optional()
            .openapi({
              param: {
                description:
                  "Un domaine ROME (1 lettre et deux chiffres) ou un grand domaine ROME (1 lettre). <br />rome et romeDomain sont incompatibles.<br /><strong>Au moins un des deux doit être renseigné.</strong>",
              },
              example: "F ou I13",
            }),
          latitude: ZLatitudeParam,
          longitude: ZLongitudeParam,
          radius: ZRadiusParam.default(30),
          diploma: zDiplomaParam.optional(),
          caller: zCallerParam.optional(),
          options: zGetFormationOptions,
        })
        .strict()
        .passthrough(),
      headers: zRefererHeaders,
      response: {
        "200": ZLbaItemFormationResult,
        "400": z.union([ZResError, ZLbacError]).openapi({
          description: "Bad Request",
        }),
        "500": z.union([ZResError, ZLbacError]).openapi({
          description: "Internal Server Error",
        }),
      },
      securityScheme: null,
      openapi: {
        tags: ["V1 - Formations"] as string[],
        description: `Rechercher des formations en alternance pour un métier ou un ensemble de métiers autour d'un point géographique\n${rateLimitDescription({
          max: 7,
          timeWindow: "1s",
        })}`,
      },
    },
    "/v1/_private/formations/min": {
      method: "get",
      path: "/v1/_private/formations/min",
      querystring: z
        .object({
          romes: zRomesParams("romeDomain"),
          romeDomain: z
            .string()
            .optional()
            .openapi({
              param: {
                description:
                  "Un domaine ROME (1 lettre et deux chiffres) ou un grand domaine ROME (1 lettre). <br />rome et romeDomain sont incompatibles.<br /><strong>Au moins un des deux doit être renseigné.</strong>",
              },
              example: "F ou I13",
            }),
          latitude: ZLatitudeParam,
          longitude: ZLongitudeParam,
          radius: ZRadiusParam.default(30),
          diploma: zDiplomaParam.optional(),
          caller: zCallerParam.optional(),
          options: zGetFormationOptions,
        })
        .strict()
        .passthrough(),
      headers: zRefererHeaders,
      response: {
        "200": ZLbaItemFormationResult,
        "400": z.union([ZResError, ZLbacError]).openapi({
          description: "Bad Request",
        }),
        "500": z.union([ZResError, ZLbacError]).openapi({
          description: "Internal Server Error",
        }),
      },
      securityScheme: null,
      openapi: {
        tags: ["V1 - Formations"] as string[],
        description: `Rechercher des formations en alternance pour un métier ou un ensemble de métiers autour d'un point géographique. Retour de données minimales\n${rateLimitDescription(
          { max: 7, timeWindow: "1s" }
        )}`,
      },
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
      openapi: {
        tags: ["V1 - Formations"] as string[],
        description: `Get one formation identified by it's clé ministère éducatif\n${rateLimitDescription({ max: 7, timeWindow: "1s" })}`,
      },
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
