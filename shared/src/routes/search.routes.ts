import { z } from "../helpers/zodWithOpenApi.js"
import { JOB_START_TYPE } from "../models/job.model.js"
import { ZSearchItem } from "../models/searchItems.model.js"
import { ZLatitudeParam, ZLongitudeParam, ZRadiusParam } from "./_params.js"
import type { IRoutesDef } from "./common.routes.js"

export const zSearchRoutes = {
  get: {
    "/v1/search": {
      method: "get",
      path: "/v1/search",
      querystring: z
        .object({
          q: z.string().optional().describe("Texte libre de recherche (fuzzy, analyse française)"),
          type: z.string().optional().describe("Type de résultat : offre ou formation"),
          mode: z
            .enum(["emplois", "formations", "emplois_formation"])
            .optional()
            .describe("Type de recherche : emplois (offres hors CFA/GEIQ), formations, ou emplois avec formation incluse (offres CFA/GEIQ)"),
          type_filter_label: z
            .union([z.array(z.string()), z.string().transform((v) => [v])])
            .optional()
            .describe("Libellé de type pour l'affichage des filtres (peut être passé plusieurs fois)"),
          contract_type: z
            .union([z.array(z.string()), z.string().transform((v) => [v])])
            .optional()
            .describe("Types de contrat (peut être passé plusieurs fois)"),
          level: z
            .union([z.array(z.string()), z.string().transform((v) => [v])])
            .optional()
            .describe("Niveau de diplôme européen (3 à 7, peut être passé plusieurs fois)"),
          activity_sector: z
            .union([z.array(z.string()), z.string().transform((v) => [v])])
            .optional()
            .describe("Secteur d'activité (peut être passé plusieurs fois)"),
          organization_name: z.string().optional().describe("Filtre par nom d'entreprise (exact)"),
          is_disabled_elligible: z
            .enum(["true", "false"])
            .transform((v) => v === "true")
            .optional()
            .describe("true : ne renvoie que les offres éligibles aux personnes en situation de handicap"),
          start_type: z.nativeEnum(JOB_START_TYPE).optional().describe("Mode de démarrage du contrat (des_que_possible | precise_date)"),
          smart_apply: z
            .enum(["true", "false"])
            .transform((v) => v === "true")
            .optional()
            .describe("true : ne renvoie que les offres avec candidature simplifiée disponible"),
          is_algo_company: z
            .enum(["true", "false"])
            .transform((v) => v === "true")
            .optional()
            .describe("true : entreprises à contacter (candidatures spontanées) ; false : offres d'emploi uniquement"),
          start_date: z.coerce
            .date()
            .optional()
            .describe("Date de début de contrat souhaitée : renvoie les offres démarrant avant ou à cette date (≤), à date flexible, ou sans date de démarrage (ISO 8601)"),
          sort: z
            .enum(["proximity", "date", "applications", "start_date"])
            .optional()
            .describe("Tri : proximité (géo), date de publication, nb de candidatures (croissant), ou date de début de contrat (croissant). Par défaut : pertinence."),
          latitude: ZLatitudeParam,
          longitude: ZLongitudeParam,
          radius: ZRadiusParam.default(30),
          page: z.coerce.number().min(0).default(0).describe("Index de page (0-based)"),
          hitsPerPage: z.coerce.number().min(1).max(100).default(20).describe("Nombre de résultats par page (max 100)"),
          source: z.enum(["suggestion", "free_text"]).optional().describe("Origine de la requête côté UI (télémétrie autocomplete, sans effet sur les résultats)"),
        })
        .strict(),
      headers: z.object({ referer: z.string().optional() }).passthrough(),
      response: {
        "200": z.object({
          hits: z.array(
            ZSearchItem.and(
              z.object({
                preview: z.array(z.object({ type: z.enum(["hit", "text"]), value: z.string() })),
                matched_words: z.array(z.object({ word: z.string(), count: z.number() })),
                distance: z.number().nullable().describe("Distance en km entre le lieu de recherche et le résultat (null sans géo)"),
              })
            )
          ),
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
          counts: z
            .object({
              is_disabled_elligible: z.number().describe("Nombre d'offres éligibles handicap dans le result set (hors filtre handi lui-même)"),
              urgent: z.number().describe("Nombre d'offres à démarrage dès que possible dans le result set (hors filtre urgent lui-même)"),
              smart_apply: z.number().describe("Nombre d'offres à candidature simplifiée dans le result set (hors filtre smart_apply lui-même)"),
            })
            .optional(),
        }),
      },
      securityScheme: null,
    },
    "/v1/search/suggest": {
      method: "get",
      path: "/v1/search/suggest",
      querystring: z
        .object({
          q: z.string().min(3).describe("Texte de saisie (autocomplétion par préfixe, min 3 caractères)"),
          limit: z.coerce.number().min(1).max(20).default(8).describe("Nombre de suggestions (max 20)"),
        })
        .strict(),
      headers: z.object({ referer: z.string().optional() }).passthrough(),
      response: {
        "200": z.object({
          suggestions: z.array(z.string()).describe("Intitulés suggérés (dédupliqués)"),
        }),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
