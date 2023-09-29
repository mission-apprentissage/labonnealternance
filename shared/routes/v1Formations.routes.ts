import { z } from "../helpers/zodWithOpenApi"
import { ZLbacError } from "../models/lbacError.model"
import { ZLbaItemFormationResult } from "../models/lbaItem.model"

import { zCallerParam, zDiplomaParam, zGetFormationOptions, zRefererHeaders } from "./_params"
import { IRoutesDef, ZResError } from "./common.routes"

export const zV1FormationsRoutes = {
  get: {
    "/v1/formations": {
      // TODO_SECURITY_FIX vérifier ce qu'on fait des emails et des téléphones et modifier les modèles en conséquences
      querystring: z
        .object({
          romes: z
            .string()
            .optional()
            .openapi({
              param: {
                description:
                  "Une liste de codes ROME séparés par des virgules correspondant au(x) métier(s) recherché(s). Maximum 20.<br />rome et romeDomain sont incompatibles.<br/><strong>Au moins un des deux doit être renseigné.</strong>",
              },
              example: "F1603,I1308",
            }),
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
          latitude: z.coerce
            .number()
            .optional()
            .openapi({
              param: {
                description: "La latitude du centre de recherche. Nécessaire avec insee et longitude pour une recherche localisée.",
              },
              example: 48.845,
            }),
          longitude: z.coerce
            .number()
            .optional()
            .openapi({
              param: {
                description: "La longitude du centre de recherche. Nécessaire avec latitude et insee pour une recherche localisée.",
              },
              example: 2.3752,
            }),
          radius: z.coerce
            .number()
            .default(30)
            .optional()
            .openapi({
              param: {
                description: "Le rayon de recherche en kilomètres",
              },
              example: 30,
            }),
          diploma: zDiplomaParam.optional(),
          caller: zCallerParam.optional(),
          options: zGetFormationOptions,
        })
        .strict(),
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
      securityScheme: {
        auth: "none",
        role: "all",
      },
      openapi: {
        description: "Rechercher des formations en alternance pour un métier ou un ensemble de métiers autour d'un point géographique",
      },
    },
    "/v1/formations/formation/:id": {
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
        "200": ZLbaItemFormationResult,
        "400": z.union([ZResError, ZLbacError]),
        "404": z.union([ZResError, ZLbacError]),
        "500": z.union([ZResError, ZLbacError]),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/v1/formations/formationDescription/:id": {
      params: z
        .object({
          id: z.string(),
        })
        .strict(),
      response: {
        // Strip souhaité. Appel à une API décommissionnée en attente de remplacement
        // eslint-disable-next-line zod/require-strict
        "200": z
          .object({
            // eslint-disable-next-line zod/require-strict
            organisme: z
              .object({
                // eslint-disable-next-line zod/require-strict
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
        "400": z.union([ZResError, ZLbacError]).openapi({
          description: "Bad Request",
        }),
        "404": z.union([ZResError, ZLbacError]).openapi({
          description: "Not Found",
        }),
        "500": z.union([ZResError, ZLbacError]).openapi({
          description: "Internal Server Error",
        }),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
} as const satisfies IRoutesDef
