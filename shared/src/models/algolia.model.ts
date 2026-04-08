import { z } from "zod"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

const collectionName = "algolia" as const

export const ZAlgoliaGeoloc = z.object({
  lat: z.number().describe("Latitude"),
  lng: z.number().describe("Longitude"),
})

export const ZAlgoliaLocation = z
  .object({
    type: z.literal("Point"),
    coordinates: z.tuple([z.number(), z.number()]),
  })
  .describe("GeoJSON Point [lng, lat] pour MongoDB Search")

export const ZAlgolia = z.object({
  _id: zObjectId,
  objectID: z.string().describe("Identifiant Algolia"),
  url_id: z.string().describe("Identifiant utilisé dans l'URL"),
  type: z.string().describe("Type de résultat (ex: offre, formation)"),
  type_filter_label: z.string().describe("Libellé du filtre de type"),
  sub_type: z.string().describe("Sous-type du résultat"),
  contract_type: z.array(z.string()).nullable().describe("Types de contrat"),
  publication_date: z.date().nullable().describe("Date de publication"),
  smart_apply: z.boolean().nullable().describe("Indique si la candidature rapide est disponible"),
  application_count: z.number().nullable().describe("Nombre de candidatures reçues"),
  title: z.string().describe("Titre de l'offre"),
  description: z.string().describe("Description de l'offre"),
  address: z.string().describe("Adresse complète"),
  _geoloc: ZAlgoliaGeoloc.describe("Coordonnées géographiques (format Algolia)"),
  location: ZAlgoliaLocation.optional().describe("GeoJSON Point pour MongoDB Search"),
  organization_name: z.string().describe("Nom de l'entreprise"),
  level: z.string().nullable().describe("Niveau de diplôme visé"),
  activity_sector: z.string().nullable().describe("Secteur d'activité"),
  keywords: z.array(z.string()).nullable().describe("Mots-clés associés à l'offre"),
})

export type IAlgolia = z.output<typeof ZAlgolia>

export default {
  zod: ZAlgolia,
  indexes: [
    [{ objectID: 1 }, { unique: true }],
    [{ type: 1, sub_type: 1 }, {}],
    [{ publication_date: -1 }, {}],
    [{ location: "2dsphere" }, {}],
  ],
  searchIndexes: [
    {
      name: "algolia_search",
      definition: {
        mappings: {
          dynamic: false,
          fields: {
            title: { type: "string", analyzer: "lucene.french", multi: { standard: { type: "string", analyzer: "lucene.standard" } } },
            description: { type: "string", analyzer: "lucene.french", multi: { standard: { type: "string", analyzer: "lucene.standard" } } },
            keywords: { type: "string", analyzer: "lucene.french", multi: { standard: { type: "string", analyzer: "lucene.standard" } } },
            organization_name: [{ type: "string", analyzer: "lucene.french", multi: { standard: { type: "string", analyzer: "lucene.standard" } } }, { type: "token" }],
            type: { type: "token" },
            type_filter_label: { type: "token" },
            sub_type: { type: "token" },
            contract_type: { type: "token" },
            level: { type: "token" },
            activity_sector: { type: "token" },
            smart_apply: { type: "boolean" },
            application_count: { type: "number" },
            publication_date: { type: "date" },
            location: { type: "geo" },
          },
        },
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
