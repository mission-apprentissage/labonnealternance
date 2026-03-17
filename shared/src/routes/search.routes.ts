import { z } from "../helpers/zodWithOpenApi.js"
import { ZAlgolia } from "../models/algolia.model.js"
import { ZLatitudeParam, ZLongitudeParam, ZRadiusParam } from "./_params.js"
import type { IRoutesDef } from "./common.routes.js"

export const zSearchRoutes = {
  get: {
    "/v1/search": {
      method: "get",
      path: "/v1/search",
      querystring: z
        .object({
          q: z
            .string()
            .optional()
            .openapi({
              param: { description: "Texte libre de recherche (fuzzy, analyse française)" },
              example: "développeur web",
            }),
          type: z
            .string()
            .optional()
            .openapi({
              param: { description: "Type de résultat : offre ou formation" },
              example: "offre",
            }),
          type_filter_label: z
            .string()
            .optional()
            .openapi({
              param: { description: "Libellé de type pour l'affichage des filtres" },
            }),
          contract_type: z
            .union([z.array(z.string()), z.string().transform((v) => [v])])
            .optional()
            .openapi({
              param: { description: "Types de contrat (peut être passé plusieurs fois)" },
              example: ["Apprentissage"],
            }),
          level: z
            .string()
            .optional()
            .openapi({
              param: { description: "Niveau de diplôme européen (3 à 7)" },
              example: "4",
            }),
          activity_sector: z
            .string()
            .optional()
            .openapi({
              param: { description: "Secteur d'activité" },
            }),
          organization_name: z
            .string()
            .optional()
            .openapi({
              param: { description: "Filtre par nom d'entreprise (exact)" },
            }),
          latitude: ZLatitudeParam,
          longitude: ZLongitudeParam,
          radius: ZRadiusParam.default(30),
          page: z.coerce
            .number()
            .min(0)
            .default(0)
            .openapi({
              param: { description: "Index de page (0-based)" },
            }),
          hitsPerPage: z.coerce
            .number()
            .min(1)
            .max(100)
            .default(20)
            .openapi({
              param: { description: "Nombre de résultats par page (max 100)" },
            }),
        })
        .strict(),
      headers: z.object({ referer: z.string().optional() }).passthrough(),
      response: {
        "200": z.object({
          hits: z.array(ZAlgolia),
          nbHits: z.number(),
          page: z.number(),
          nbPages: z.number(),
          facets: z
            .object({
              type: z.record(z.number()),
              type_filter_label: z.record(z.number()),
              contract_type: z.record(z.number()),
              level: z.record(z.number()),
              activity_sector: z.record(z.number()),
              organization_name: z.record(z.number()),
            })
            .optional(),
        }),
      },
      securityScheme: null,
      openapi: {
        tags: ["Search"],
        summary: "Recherche full-text dans les offres et formations",
        description:
          "Endpoint de recherche unifié utilisant MongoDB Search (mongot/Lucene). Supporte la recherche textuelle, le filtrage par facettes et la recherche géographique.",
      },
    },
  },
} as const satisfies IRoutesDef
