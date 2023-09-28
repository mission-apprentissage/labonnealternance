import { z } from "../helpers/zodWithOpenApi"
import { ZLbacError } from "../models/lbacError.model"
import { ZLbaItem, ZLbaItemFormation } from "../models/lbaItem.model"

import { IRoutesDef, ZResError } from "./common.routes"

export const zV1FormationsRoutes = {
  get: {
    "/api/v1/formations": {
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
          diploma: z
            .union([z.string().startsWith("3"), z.string().startsWith("4"), z.string().startsWith("5"), z.string().startsWith("6"), z.string().startsWith("7")])
            .optional()
            .openapi({
              param: {
                description: "Le niveau de diplôme requis. Si précisé, doit contenir à minima le chiffre d'une seule des valeurs autorisées",
              },
              type: "string",
              example: "3",
            }),
          caller: z
            .string()
            .optional()
            .openapi({
              param: {
                description: "Votre raison sociale ou le nom de votre produit qui fait appel à l'API idéalement préfixé par une adresse email de contact",
              },
              example: "contact@domaine nom_de_societe",
            }),
          options: z
            .literal("with_description")
            .optional()
            .openapi({
              param: {
                description: "Ajoute la description au résultat de retour",
              },
              example: "with_description",
            }),
        })
        .strict(),
      headers: z
        .object({
          referer: z.string().optional(),
        })
        .passthrough(),
      response: {
        "200": z
          .object({
            results: z.array(ZLbaItemFormation).openapi({ description: "Un tableau de formations correspondantes aux critères" }),
          })
          .strict()
          .openapi({
            description:
              "Un tableau contenant la liste des formations correspondants aux critères transmis en paramètre de la requête. Le tableau peut être vide si aucune formation ne correspond.",
          }),
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
