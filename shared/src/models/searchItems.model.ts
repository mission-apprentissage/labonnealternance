import { z } from "zod"

import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"
import { JOB_START_TYPE } from "./job.model.js"

const collectionName = "search_items" as const

export const ZSearchItemLocation = z
  .object({
    type: z.literal("Point"),
    coordinates: z.tuple([z.number(), z.number()]),
  })
  .describe("GeoJSON Point [lng, lat] pour MongoDB Search")

export const ZSearchItem = z.object({
  _id: zObjectId,
  url_id: z.string().describe("Identifiant utilisé dans l'URL"),
  type: z.string().describe("Type de résultat (ex: offre, formation)"),
  type_filter_label: z.string().describe("Libellé du filtre de type"),
  sub_type: z.string().describe("Sous-type du résultat"),
  contract_type: z.array(z.string()).nullable().describe("Types de contrat"),
  publication_date: z.date().nullable().describe("Date de publication"),
  is_disabled_elligible: z.boolean().nullable().describe("Offre éligible aux personnes en situation de handicap (null pour les formations)"),
  start_date: z.date().nullable().describe("Date de début de contrat (offres uniquement)"),
  start_type: extensions.buildEnum(JOB_START_TYPE).nullable().describe("Mode de démarrage du contrat (offres uniquement)"),
  smart_apply: z.boolean().nullable().describe("Indique si la candidature rapide est disponible"),
  application_count: z.number().nullable().describe("Nombre de candidatures reçues"),
  title: z.string().describe("Titre de l'offre"),
  description: z.string().describe("Description de l'offre"),
  address: z.string().describe("Adresse complète"),
  location: ZSearchItemLocation.optional().describe("GeoJSON Point pour MongoDB Search"),
  organization_name: z.string().describe("Nom de l'entreprise"),
  level: z.string().nullable().describe("Niveau de diplôme visé"),
  activity_sector: z.string().nullable().describe("Secteur d'activité"),
  keywords: z.array(z.string()).nullable().describe("Mots-clés associés à l'offre (enrichissement Mistral)"),
  rome_labels: z.array(z.string()).nullable().describe("Intitulés ROME associés (signal métier déterministe, dérivé des rome_codes)"),
})

export type ISearchItem = z.output<typeof ZSearchItem>

export default {
  zod: ZSearchItem,
  indexes: [
    [{ type: 1, sub_type: 1 }, {}],
    [{ publication_date: -1 }, {}],
    [{ location: "2dsphere" }, {}],
  ],
  searchIndexes: [
    {
      name: "search_items_index",
      definition: {
        mappings: {
          dynamic: false,
          fields: {
            // title et rome_labels indexés aussi en `autocomplete` (préfixes) pour les suggestions de saisie.
            title: [
              { type: "string", analyzer: "lucene.french", multi: { standard: { type: "string", analyzer: "lucene.standard" } } },
              { type: "autocomplete", tokenization: "edgeGram", minGrams: 3, maxGrams: 15, foldDiacritics: true },
            ],
            description: { type: "string", analyzer: "lucene.french", multi: { standard: { type: "string", analyzer: "lucene.standard" } } },
            keywords: { type: "string", analyzer: "lucene.french", multi: { standard: { type: "string", analyzer: "lucene.standard" } } },
            rome_labels: [
              { type: "string", analyzer: "lucene.french", multi: { standard: { type: "string", analyzer: "lucene.standard" } } },
              { type: "autocomplete", tokenization: "edgeGram", minGrams: 3, maxGrams: 15, foldDiacritics: true },
            ],
            // organization_name : nom d'organisme (CFA / entreprise), jamais à raciniser → analyzer dédié sans stemming.
            organization_name: [{ type: "string", analyzer: "lba_company", multi: { standard: { type: "string", analyzer: "lucene.standard" } } }, { type: "token" }],
            type: { type: "token" },
            type_filter_label: { type: "token" },
            sub_type: { type: "token" },
            contract_type: { type: "token" },
            level: { type: "token" },
            activity_sector: { type: "token" },
            smart_apply: { type: "boolean" },
            application_count: { type: "number" },
            publication_date: { type: "date" },
            is_disabled_elligible: { type: "boolean" },
            start_date: { type: "date" },
            start_type: { type: "token" },
            location: { type: "geo" },
          },
        },
        analyzers: [
          {
            // Noms d'organismes : minuscules + sans accents, sans stemming ni stopwords (noms propres préservés).
            name: "lba_company",
            tokenizer: { type: "standard" },
            tokenFilters: [{ type: "lowercase" }, { type: "asciiFolding" }],
          },
        ],
        synonyms: [
          {
            name: "lba_synonyms",
            analyzer: "lucene.standard",
            source: { collection: "search_synonyms" },
          },
        ],
      },
    },
  ],
  collectionName,
} as const satisfies IModelDescriptor
