import { z } from "../helpers/zodWithOpenApi"
import { ZApiError, ZLbacError } from "../models/lbacError.model"
import { ZLbaItemFormation, ZLbaItemFormation2, ZLbaItemFtJob, ZLbaItemLbaCompany, ZLbaItemLbaJob } from "../models/lbaItem.model"
import { rateLimitDescription } from "../utils/rateLimitDescription"

import {
  zCallerParam,
  zDiplomaParam,
  zGetFormationOptions,
  zInseeParams,
  ZLatitudeParam,
  ZLongitudeParam,
  zOpcoParams,
  zOpcoUrlParams,
  ZRadiusParam,
  zRefererHeaders,
  zRncpsParams,
  zRomesParams,
  zSourcesParams,
} from "./_params"
import { IRoutesDef, ZResError } from "./common.routes"

export const zFormationsRoutesV2 = {
  get: {
    "/v2/formations": {
      method: "get",
      path: "/v2/formations",
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
        "200": z.array(ZLbaItemFormation2),
      },
      securityScheme: {
        auth: "api-apprentissage",
        access: null,
        resources: {},
      },
      openapi: {
        tags: ["V2 - Formations"] as string[],
        operationId: "getFormations",
        description: `Rechercher des formations en alternance pour un métier ou un ensemble de métiers autour d'un point géographique\n${rateLimitDescription({
          max: 7,
          timeWindow: "1s",
        })}`,
      },
    },
    "/v2/formations/min": {
      method: "get",
      path: "/v2/formations/min",
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
        "200": z.array(ZLbaItemFormation2),
      },
      securityScheme: {
        auth: "api-key",
        access: null,
        resources: {},
      },
      openapi: {
        tags: ["V2 - Formations"] as string[],
        operationId: "getFormations",
        description: `Rechercher des formations en alternance pour un métier ou un ensemble de métiers autour d'un point géographique. Récupération des données minimales.\n${rateLimitDescription(
          { max: 7, timeWindow: "1s" }
        )}`,
      },
    },
    "/v2/formations/formation/:id": {
      method: "get",
      path: "/v2/formations/formation/:id",
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
        "200": ZLbaItemFormation2,
      },
      securityScheme: {
        auth: "api-key",
        access: null,
        resources: {},
      },
      openapi: {
        tags: ["V2 - Formations"] as string[],
        operationId: "getFormation",
        description: `Get one formation identified by it's clé ministère éducatif\n${rateLimitDescription({ max: 7, timeWindow: "1s" })}`,
      },
    },
    "/v2/formationsParRegion": {
      method: "get",
      path: "/v2/formationsParRegion",
      querystring: z
        .object({
          romes: z
            .string()
            .optional()
            .openapi({
              param: {
                description:
                  "Une liste de codes ROME séparés par des virgules correspondant au(x) métier(s) recherché(s). Maximum 20.<br />rome et romeDomain sont incompatibles.<br /><strong>Au moins un des deux doit être renseigné dans le cas d'une recherche France entière.</strong>",
              },

              example: "F1603,I1308",
            }),
          romeDomain: z.string().optional().openapi({
            description:
              "Un domaine ROME (1 lettre et deux chiffres) ou un grand domaine ROME (1 lettre).<br />rome et romeDomain sont incompatibles.<br /><strong>Au moins un des deux doit être renseigné dans le cas d'une recherche France entière.</strong>",
            example: "F ou I13",
          }),
          caller: zCallerParam,
          departement: z
            .string()
            .optional()
            .openapi({
              param: {
                description:
                  "Le numéro à 2 chiffres d'un département français ou à 3 chiffres pour un département d'outre-mer.<br />region et departement sont incompatibles.<br /><strong>Si aucun des deux n'est renseigné la recherche portera sur France entière.</strong><br /><strong>France entière ne peut être utilisé sans rome ou romeDomain.</strong>",
              },
              example: "09 ou 974",
            }),
          region: z
            .string()
            .optional()
            .openapi({
              param: {
                description:
                  "Le code Insee d'une région française.<br />region et departement sont incompatibles.<br /><strong>Si aucun des deux n'est renseigné la recherche portera sur France entière.</strong><br /><strong>France entière ne peut être utilisé sans rome ou romeDomain.</strong><br /><ul><li>84 : Auvergne-Rhône-Alpes</li><li>27 : Bourgogne-Franche-Comté</li><li>53 : Bretagne</li><li>24 : Centre-Val de Loire</li><li>94 : Corse</li><li>44 : Grand Est</li><li>32 : Hauts-de-France</li><li>11 : Île-de-France</li><li>28 : Normandie</li><li>75 : Nouvelle-Aquitaine</li><li>76 : Occitanie</li><li>52 : Pays de la Loire</li><li>93 : Provence-Alpes-Côte d'Azur</li><li>01 : Guadeloupe</li><li>02 : Martinique</li><li>03 : Guyane</li><li>04 : La Réunion</li><li>06 : Mayotte</li></ul>",
              },
              example: "84",
            }),
          diploma: zDiplomaParam.optional(),
          options: zGetFormationOptions,
        })
        .strict()
        .passthrough(),
      headers: zRefererHeaders,
      response: {
        "200": z.array(ZLbaItemFormation2),
      },
      securityScheme: {
        auth: "api-key",
        access: null,
        resources: {},
      },
      openapi: {
        tags: ["V2 - Formations"] as string[],
        description: `Rechercher des formations en alternance dans un département ou dans une région ou dans la France entière pour un métier ou un ensemble de métiers\n${rateLimitDescription(
          { max: 7, timeWindow: "1s" }
        )}`,
        operationId: "getFormations",
      },
    },
    "/v2/jobsEtFormations": {
      method: "get",
      path: "/v2/jobsEtFormations",
      querystring: z
        .object({
          romes: zRomesParams("rncp"),
          rncp: zRncpsParams,
          caller: zCallerParam,
          latitude: ZLatitudeParam,
          longitude: ZLongitudeParam,
          radius: ZRadiusParam,
          insee: zInseeParams,
          sources: zSourcesParams,
          diploma: zDiplomaParam,
          opco: zOpcoParams,
          opcoUrl: zOpcoUrlParams,
          options: z.literal("with_description").optional(), // hidden
        })
        .strict()
        .passthrough(),
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
                      results: z.array(ZLbaItemFtJob),
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
      securityScheme: { auth: "api-key", access: null, resources: {} },
      openapi: {
        tags: ["V2 - Jobs et formations"] as string[],
        description: `${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
      },
    },
  },
} as const satisfies IRoutesDef
