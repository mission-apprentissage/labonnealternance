import { z } from "../helpers/zodWithOpenApi"
import { ZAppellationsRomes, ZMetierEnrichiArray, ZMetiers } from "../models/diplomesMetiers.model"
import { rateLimitDescription } from "../utils/rateLimitDescription"

import { IRoutesDef } from "./common.routes"

export const zMetiersRoutesV2 = {
  get: {
    "/metiers/metiersParFormation/:cfd": {
      method: "get",
      path: "/metiers/metiersParFormation/:cfd",
      params: z
        .object({
          cfd: z
            .string()
            .min(1)
            .openapi({
              param: {
                description: "L'identifiant CFD de la formation.",
              },
              example: "50022137",
            }),
        })
        .strict(),
      response: {
        200: ZMetiers,
      },
      securityScheme: { auth: "api-key", access: null, resources: {} },
      openapi: {
        description: `Récupérer la liste des noms des métiers du référentiel de La bonne alternance pour une formation donnée\n${rateLimitDescription({
          max: 20,
          timeWindow: "1s",
        })}`,
        tags: ["V2 - Metiers"] as string[],
        operationId: "getMetiersParCfd",
      },
    },
    "/metiers/all": {
      method: "get",
      path: "/metiers/all",
      response: {
        200: ZMetiers,
      },
      securityScheme: { auth: "api-key", access: null, resources: {} },
      openapi: {
        description: `Retourne la liste de tous les métiers référencés sur LBA\n${rateLimitDescription({ max: 20, timeWindow: "1s" })}`,
        tags: ["V2 - Metiers"] as string[],
        operationId: "getTousLesMetiers",
      },
    },
    "/metiers": {
      method: "get",
      path: "/metiers",
      querystring: z
        .object({
          title: z.string().openapi({
            param: {
              description: "Un terme libre de recherche de métier.",
            },
            example: "Décoration",
          }),
          romes: z
            .string()
            .openapi({
              param: {
                description: "Une liste de codes ROME séparés par des virgules correspondant au(x) métier(s) recherché(s).",
              },
              example: "F1603,I1308",
            })
            .optional(),
          rncps: z
            .string()
            .optional()
            .openapi({
              param: {
                description: "Une liste de codes RNCP séparés par des virgules correspondant au(x) métier(s) recherché(s).",
              },
              example: "RNCP500,RNCP806",
            }),
        })
        .strict(),
      response: {
        200: z
          .object({
            labelsAndRomes: ZMetierEnrichiArray,
          })
          .strict(),
      },
      securityScheme: { auth: "api-key", access: null, resources: {} },
      openapi: {
        description: `Récupérer la liste des noms des métiers du référentiel de La bonne alternance\n${rateLimitDescription({ max: 20, timeWindow: "1s" })}`,
        tags: ["V2 - Metiers"] as string[],
        operationId: "getMetiers",
      },
    },
    "/metiers/intitule": {
      method: "get",
      path: "/metiers/intitule",
      querystring: z
        .object({
          label: z.string().nonempty().openapi({
            description: "le(s) terme(s) de recherche",
          }),
        })
        .strict(),
      response: {
        200: ZAppellationsRomes.strict(),
      },
      securityScheme: { auth: "api-key", access: null, resources: {} },
      openapi: {
        description: `Retourne une liste de métiers enrichis avec les codes romes associés correspondant aux critères en paramètres\n${rateLimitDescription({
          max: 20,
          timeWindow: "1s",
        })}`,
        tags: ["V2 - Metiers"] as string[],
        operationId: "getCoupleAppellationRomeIntitule",
      },
    },
  },
} as const satisfies IRoutesDef
