import type { IAlgolia } from "shared/models/index"

import { getDistanceInKm } from "@/common/utils/geolib"
import { getDbCollection } from "@/common/utils/mongodbUtils"

const HIGHLIGHT_MAX_PASSAGES = 5
const HIGHLIGHT_MAX_CHARS = 300

export type Highlight = {
  score: number
  path: string
  texts: Array<{ type: "hit" | "text"; value: string }>
}

export type PreviewItem = { type: "hit" | "text"; value: string }

function splitHighlightPerNewline(highlight: Highlight): Highlight[] {
  const highlights: Highlight[] = []
  let current: Highlight = { score: highlight.score, path: highlight.path, texts: [] }

  for (const text of highlight.texts) {
    if (text.type === "text" && text.value.includes("\n")) {
      const parts = text.value.split("\n")
      const firstLine = parts[0].trim()
      if (firstLine) current.texts.push({ type: "text", value: firstLine })
      if (current.texts.some((t) => t.type === "hit")) highlights.push(current)
      current = { score: highlight.score, path: highlight.path, texts: [] }
      const lastLine = parts.at(-1)?.trim()
      if (lastLine) current.texts.push({ type: "text", value: lastLine })
    } else {
      current.texts.push({ type: text.type, value: text.value.trim() })
    }
  }

  if (current.texts.some((t) => t.type === "hit")) highlights.push(current)
  return highlights
}

function getHighlightSize(highlight: Highlight): number {
  return highlight.texts.reduce((acc, t) => acc + t.value.length + 1, 0)
}

export function buildPreviewText(highlights: Highlight[]): PreviewItem[] {
  const formatted = highlights.flatMap(splitHighlightPerNewline)
  if (formatted.length === 0) return []

  const sorted = [...formatted].sort((a, b) => b.score - a.score)
  let currentSize = 0
  const selected = new Set<Highlight>()

  for (const h of sorted) {
    currentSize += getHighlightSize(h)
    selected.add(h)
    if (currentSize > HIGHLIGHT_MAX_CHARS) break
  }

  const output: PreviewItem[] = []
  for (const h of formatted) {
    if (!selected.has(h)) continue
    output.push({ type: "text", value: "[...]" })
    for (const text of h.texts) output.push(text)
  }
  output.push({ type: "text", value: "[...]" })
  return output
}

export function buildSearchMatchWords(highlights: Highlight[]): Array<{ word: string; count: number }> {
  const hits = new Map<string, number>()
  const normsToWords = new Map<string, Set<string>>()

  for (const highlight of highlights) {
    for (const text of highlight.texts) {
      if (text.type === "hit") {
        const value = text.value.toLowerCase()
        hits.set(value, (hits.get(value) ?? 0) + 1)
        const set = normsToWords.get(value)
        if (set) set.add(value)
        else normsToWords.set(value, new Set([value]))
      }
    }
  }

  const result: Array<{ word: string; count: number }> = []
  for (const [, words] of normsToWords) {
    let best = { word: "", count: 0 }
    let total = 0
    for (const w of words) {
      const c = hits.get(w) ?? 0
      total += c
      if (c > best.count) best = { word: w, count: c }
    }
    result.push({ word: best.word, count: total })
  }

  return result.sort((a, b) => b.count - a.count)
}

type SortOption = "proximity" | "smart_apply" | "date"

interface ISearchFilters {
  q?: string
  type?: string
  type_filter_label?: string[]
  contract_type?: string[]
  level?: string[]
  activity_sector?: string[]
  organization_name?: string
  sort?: SortOption
  latitude?: number
  longitude?: number
  radius: number
  page: number
  hitsPerPage: number
}

interface ISearchFacets {
  type: Record<string, number>
  type_filter_label: Record<string, number>
  contract_type: Record<string, number>
  level: Record<string, number>
  activity_sector: Record<string, number>
  organization_name: Record<string, number>
}

type SearchRow = IAlgolia & {
  highlights: Highlight[]
  _meta: { count: { total: number } }
}

const SYNONYM_MULTI_PATHS = [
  { value: "title", multi: "standard" },
  { value: "description", multi: "standard" },
  { value: "keywords", multi: "standard" },
  { value: "rome_labels", multi: "standard" },
  { value: "organization_name", multi: "standard" },
]

function buildTextClauses(q?: string): object[] {
  // Champs homogènes cross-type (offre / formation / recruteur) → boosting par champ correct.
  // rome_labels : signal métier déterministe (dérivé des rome_codes), présent pour les 3 types.
  // Une clause `text` par champ avec un poids dédié, + une clause synonymes (expansion d'abréviations).
  const fuzzy = { maxEdits: 1, prefixLength: 1 }
  return q
    ? [
        { text: { query: q, path: "rome_labels", fuzzy, score: { boost: { value: 8 } } } },
        { text: { query: q, path: "title", fuzzy, score: { boost: { value: 7 } } } },
        { text: { query: q, path: "keywords", fuzzy, score: { boost: { value: 5 } } } },
        { text: { query: q, path: "organization_name", fuzzy, score: { boost: { value: 3 } } } },
        { text: { query: q, path: "description", fuzzy, score: { boost: { value: 2 } } } },
        { text: { query: q, path: SYNONYM_MULTI_PATHS, synonyms: "lba_synonyms" } },
      ]
    : []
}

function buildCompoundOperator(filters: ISearchFilters) {
  const { q, type, type_filter_label, contract_type, level, activity_sector, organization_name, sort, latitude, longitude, radius } = filters
  const hasGeo = latitude !== undefined && longitude !== undefined
  const proximity = sort === "proximity" && hasGeo

  const textClauses = buildTextClauses(q)

  const filter: object[] = []

  if (type) filter.push({ equals: { path: "type", value: type } })
  if (type_filter_label?.length) filter.push({ in: { path: "type_filter_label", value: type_filter_label } })
  if (contract_type?.length) filter.push({ in: { path: "contract_type", value: contract_type } })
  if (level?.length) filter.push({ in: { path: "level", value: level } })
  if (activity_sector?.length) filter.push({ in: { path: "activity_sector", value: activity_sector } })
  if (organization_name) filter.push({ equals: { path: "organization_name", value: organization_name } })
  if (hasGeo) {
    filter.push({
      geoWithin: {
        circle: { center: { type: "Point", coordinates: [longitude, latitude] }, radius: radius * 1000 },
        path: "location",
      },
    })
  }

  // Tri par proximité : le texte devient un filtre (must), et le score provient
  // de l'opérateur `near` (plus c'est proche, plus le score est élevé). Le tri
  // par score restitue donc les résultats du plus proche au plus lointain.
  if (proximity) {
    if (textClauses.length) filter.push({ compound: { should: textClauses, minimumShouldMatch: 1 } })
    // `near` en `must` : matche tous les docs et donne un score décroissant avec la
    // distance. pivot = 1 km → score très sensible à la distance (tri ~ proche d'abord).
    const near = { near: { path: "location", origin: { type: "Point", coordinates: [longitude, latitude] }, pivot: 1000 } }
    if (!filter.length) filter.push({ exists: { path: "type" } })
    return { must: [near], filter }
  }

  // minimumShouldMatch: 1 garantit qu'au moins une clause texte matche (logique OR)
  if (!textClauses.length && !filter.length) {
    filter.push({ exists: { path: "type" } })
  }

  return { ...(textClauses.length ? { should: textClauses, minimumShouldMatch: 1 } : {}), filter }
}

// Étape de tri du $search selon l'option choisie (défaut : pertinence + tie-breaks).
function buildSortStage(filters: ISearchFilters): Record<string, unknown> {
  const hasGeo = filters.latitude !== undefined && filters.longitude !== undefined

  if (filters.sort === "date") {
    return { publication_date: { order: -1 } }
  }
  if (filters.sort === "smart_apply") {
    return { smart_apply: { order: -1 }, score: { $meta: "searchScore", order: -1 }, application_count: { order: 1 } }
  }
  if (filters.sort === "proximity" && hasGeo) {
    return { score: { $meta: "searchScore", order: -1 } }
  }

  return {
    score: { $meta: "searchScore", order: -1 },
    smart_apply: { order: 1 },
    application_count: { order: 1 },
  }
}

// Compound sans filtres de dimension — utilisé pour $searchMeta (faceting disjoint).
// Les counts reflètent texte + géo seulement, indépendamment des filtres actifs,
// Dimensions de facette pilotées par les filtres multi-sélection du front.
const FACET_DIMENSIONS = ["type_filter_label", "contract_type", "level", "activity_sector", "organization_name"] as const
type FacetDimension = (typeof FACET_DIMENSIONS)[number]

const FACET_FIELD_DEFS: Record<string, object> = {
  type: { type: "string", path: "type" },
  type_filter_label: { type: "string", path: "type_filter_label" },
  contract_type: { type: "string", path: "contract_type" },
  level: { type: "string", path: "level" },
  activity_sector: { type: "string", path: "activity_sector" },
  organization_name: { type: "string", path: "organization_name", numBuckets: 100 },
}

function isDimensionActive(filters: ISearchFilters, key: FacetDimension): boolean {
  const value = filters[key]
  return Array.isArray(value) ? value.length > 0 : Boolean(value)
}

// Faceting DISJONCTIF : compound = texte + géo + type + tous les filtres de dimension
// SAUF `exclude`. Ainsi une facette ne masque pas ses propres options en multi-sélection,
// mais reflète bien les restrictions imposées par les AUTRES filtres (filtres synchronisés).
function buildFacetCompound(filters: ISearchFilters, exclude: FacetDimension | null) {
  const { q, type, type_filter_label, contract_type, level, activity_sector, organization_name, latitude, longitude, radius } = filters
  const hasGeo = latitude !== undefined && longitude !== undefined
  const textClauses = buildTextClauses(q)
  const filter: object[] = []

  if (type) filter.push({ equals: { path: "type", value: type } })
  if (exclude !== "type_filter_label" && type_filter_label?.length) filter.push({ in: { path: "type_filter_label", value: type_filter_label } })
  if (exclude !== "contract_type" && contract_type?.length) filter.push({ in: { path: "contract_type", value: contract_type } })
  if (exclude !== "level" && level?.length) filter.push({ in: { path: "level", value: level } })
  if (exclude !== "activity_sector" && activity_sector?.length) filter.push({ in: { path: "activity_sector", value: activity_sector } })
  if (exclude !== "organization_name" && organization_name) filter.push({ equals: { path: "organization_name", value: organization_name } })
  if (hasGeo) filter.push({ geoWithin: { circle: { center: { type: "Point", coordinates: [longitude, latitude] }, radius: radius * 1000 }, path: "location" } })

  if (!textClauses.length && !filter.length) filter.push({ exists: { path: "type" } })
  return { ...(textClauses.length ? { should: textClauses, minimumShouldMatch: 1 } : {}), filter }
}

type FacetMetaRow = { facet?: Record<string, { buckets: { _id: string; count: number }[] }> }

// Construit les groupes de $searchMeta minimisant le nombre de requêtes :
// - 1 groupe pour toutes les dimensions NON sélectionnées (+ `type`), calculé avec tous les filtres actifs ;
// - 1 groupe par dimension sélectionnée, calculé en excluant cette dimension.
function buildFacetGroups(filters: ISearchFilters): { keys: string[]; compound: object }[] {
  const activeDims = FACET_DIMENSIONS.filter((k) => isDimensionActive(filters, k))
  const inactiveDims = FACET_DIMENSIONS.filter((k) => !activeDims.includes(k))

  const groups: { keys: string[]; compound: object }[] = [{ keys: [...inactiveDims, "type"], compound: buildFacetCompound(filters, null) }]
  for (const dim of activeDims) groups.push({ keys: [dim], compound: buildFacetCompound(filters, dim) })
  return groups
}

export type SearchHit = IAlgolia & {
  preview: PreviewItem[]
  matched_words: Array<{ word: string; count: number }>
  distance: number | null
}

export async function searchAlgolia(params: ISearchFilters): Promise<{
  hits: SearchHit[]
  nbHits: number
  page: number
  nbPages: number
  facets?: ISearchFacets
}> {
  const { page, hitsPerPage, latitude, longitude } = params
  const compound = buildCompoundOperator(params)
  const facetGroups = buildFacetGroups(params)

  const [rows, ...metaArrays] = await Promise.all([
    getDbCollection("algolia")
      .aggregate<SearchRow>([
        {
          $search: {
            index: "algolia_search",
            compound,
            sort: buildSortStage(params),
            highlight: {
              // rome_labels inclus : les recruteurs n'ont pas de description → preview via les intitulés métier.
              path: ["title", "description", "rome_labels"],
              maxNumPassages: HIGHLIGHT_MAX_PASSAGES,
            },
            count: { type: "total" },
          },
        },
        {
          $addFields: {
            highlights: { $meta: "searchHighlights" },
            _meta: "$$SEARCH_META",
          },
        },
        { $skip: page * hitsPerPage },
        { $limit: hitsPerPage },
      ])
      .toArray(),

    // Une requête $searchMeta par groupe de facettes (faceting disjonctif).
    ...facetGroups.map((group) =>
      getDbCollection("algolia")
        .aggregate<FacetMetaRow>([
          {
            $searchMeta: {
              index: "algolia_search",
              facet: {
                operator: { compound: group.compound },
                facets: Object.fromEntries(group.keys.map((key) => [key, FACET_FIELD_DEFS[key]])),
              },
            },
          },
        ])
        .toArray()
    ),
  ])

  const nbHits = rows[0]?._meta?.count?.total ?? 0
  const nbPages = Math.ceil(nbHits / hitsPerPage)

  const hasGeo = latitude !== undefined && longitude !== undefined

  const hits: SearchHit[] = rows.map(({ highlights, _meta: _m, ...doc }) => {
    const algoliaDoc = doc as IAlgolia
    const distance =
      hasGeo && algoliaDoc.location
        ? getDistanceInKm({
            origin: { latitude, longitude },
            destination: { latitude: algoliaDoc.location.coordinates[1], longitude: algoliaDoc.location.coordinates[0] },
          })
        : null
    return {
      ...algoliaDoc,
      preview: buildPreviewText(highlights ?? []),
      matched_words: buildSearchMatchWords(highlights ?? []),
      distance,
    }
  })

  // Fusionne les buckets de chaque groupe en un seul objet de facettes.
  const facets: ISearchFacets = { type: {}, type_filter_label: {}, contract_type: {}, level: {}, activity_sector: {}, organization_name: {} }
  metaArrays.forEach((arr, i) => {
    const facet = arr[0]?.facet
    if (!facet) return
    for (const key of facetGroups[i].keys) {
      const buckets = facet[key]?.buckets ?? []
      facets[key as keyof ISearchFacets] = Object.fromEntries(buckets.map((b) => [b._id, b.count]))
    }
  })

  return { hits, nbHits, page, nbPages, facets }
}

// Autocomplétion par préfixe : opérateur `autocomplete` sur les champs indexés en edgeGram
// (title + rome_labels). Renvoie des intitulés dédupliqués pour alimenter la barre de recherche.
export async function suggestAlgolia({ q, limit }: { q: string; limit: number }): Promise<{ suggestions: string[] }> {
  const rows = await getDbCollection("algolia")
    .aggregate<{ title: string; rome_labels: string[] | null }>([
      {
        $search: {
          index: "algolia_search",
          compound: {
            should: [
              { autocomplete: { query: q, path: "title", fuzzy: { maxEdits: 1 }, score: { boost: { value: 2 } } } },
              { autocomplete: { query: q, path: "rome_labels", fuzzy: { maxEdits: 1 } } },
            ],
            minimumShouldMatch: 1,
          },
        },
      },
      { $limit: limit * 5 },
      { $project: { _id: 0, title: 1, rome_labels: 1 } },
    ])
    .toArray()

  // Normalisation (minuscules + sans accents) pour le filtrage et la déduplication.
  const diacritics = new RegExp("[\\u0300-\\u036f]", "g")
  const normalize = (s: string) => s.normalize("NFD").replace(diacritics, "").toLowerCase().trim()
  const normalizedQuery = normalize(q)

  // On ne garde que les intitulés contenant réellement la saisie (évite le bruit fuzzy/indirect),
  // dédupliqués en préservant l'ordre de pertinence.
  const seen = new Set<string>()
  const suggestions: string[] = []
  for (const row of rows) {
    for (const candidate of [row.title, ...(row.rome_labels ?? [])]) {
      const value = candidate?.trim()
      if (!value) continue
      const normalized = normalize(value)
      if (!normalized.includes(normalizedQuery) || seen.has(normalized)) continue
      seen.add(normalized)
      suggestions.push(value)
      if (suggestions.length >= limit) return { suggestions }
    }
  }
  return { suggestions }
}
