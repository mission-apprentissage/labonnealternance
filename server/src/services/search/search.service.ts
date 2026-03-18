import type { IAlgolia } from "shared/models/index"

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

interface ISearchFilters {
  q?: string
  type?: string
  type_filter_label?: string[]
  contract_type?: string[]
  level?: string[]
  activity_sector?: string[]
  organization_name?: string
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
  { value: "organization_name", multi: "standard" },
]

function buildCompoundOperator(filters: ISearchFilters) {
  const { q, type, type_filter_label, contract_type, level, activity_sector, organization_name, latitude, longitude, radius } = filters

  // Deux clauses should pour la recherche textuelle :
  // 1. French + fuzzy  — couverture principale des termes français
  // 2. Standard + synonymes — expansion des abréviations (ex: ccgo → Chef de chantier gros oeuvre)
  // minimumShouldMatch: 1 garantit qu'au moins une clause doit matcher (logique OR)
  const should: object[] = q
    ? [
        { text: { query: q, path: ["title", "description", "keywords", "organization_name"], fuzzy: { maxEdits: 1 } } },
        { text: { query: q, path: SYNONYM_MULTI_PATHS, synonyms: "lba_synonyms" } },
      ]
    : []

  const filter: object[] = []

  if (type) filter.push({ equals: { path: "type", value: type } })
  if (type_filter_label?.length) filter.push({ in: { path: "type_filter_label", value: type_filter_label } })
  if (contract_type?.length) filter.push({ in: { path: "contract_type", value: contract_type } })
  if (level?.length) filter.push({ in: { path: "level", value: level } })
  if (activity_sector?.length) filter.push({ in: { path: "activity_sector", value: activity_sector } })
  if (organization_name) filter.push({ equals: { path: "organization_name", value: organization_name } })
  if (latitude !== undefined && longitude !== undefined) {
    filter.push({
      geoWithin: {
        circle: { center: { type: "Point", coordinates: [longitude, latitude] }, radius: radius * 1000 },
        path: "location",
      },
    })
  }

  if (!should.length && !filter.length) {
    filter.push({ exists: { path: "type" } })
  }

  return { ...(should.length ? { should, minimumShouldMatch: 1 } : {}), filter }
}

// Compound sans filtres de dimension — utilisé pour $searchMeta (faceting disjoint).
// Les counts reflètent texte + géo seulement, indépendamment des filtres actifs,
// ce qui permet à tous les buckets de rester visibles lors de la multi-sélection.
function buildBaselineCompound(filters: ISearchFilters) {
  const { q, latitude, longitude, radius } = filters

  const should: object[] = q
    ? [
        { text: { query: q, path: ["title", "description", "keywords", "organization_name"], fuzzy: { maxEdits: 1 } } },
        { text: { query: q, path: SYNONYM_MULTI_PATHS, synonyms: "lba_synonyms" } },
      ]
    : []

  const filter: object[] = []

  if (latitude !== undefined && longitude !== undefined) {
    filter.push({
      geoWithin: {
        circle: { center: { type: "Point", coordinates: [longitude, latitude] }, radius: radius * 1000 },
        path: "location",
      },
    })
  }

  if (!should.length && !filter.length) {
    filter.push({ exists: { path: "type" } })
  }

  return { ...(should.length ? { should, minimumShouldMatch: 1 } : {}), filter }
}

export type SearchHit = IAlgolia & {
  preview: PreviewItem[]
  matched_words: Array<{ word: string; count: number }>
}

export async function searchAlgolia(params: ISearchFilters): Promise<{
  hits: SearchHit[]
  nbHits: number
  page: number
  nbPages: number
  facets?: ISearchFacets
}> {
  const { page, hitsPerPage } = params
  const compound = buildCompoundOperator(params)
  const compoundBaseline = buildBaselineCompound(params)

  const [rows, meta] = await Promise.all([
    getDbCollection("algolia")
      .aggregate<SearchRow>([
        {
          $search: {
            index: "algolia_search",
            compound,
            sort: {
              score: { $meta: "searchScore", order: -1 },
              smart_apply: { order: 1 },
              application_count: { order: 1 },
            },
            highlight: {
              path: ["title", "description"],
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

    getDbCollection("algolia")
      .aggregate<{
        count: { lowerBound: number }
        facet: {
          type: { buckets: { _id: string; count: number }[] }
          type_filter_label: { buckets: { _id: string; count: number }[] }
          contract_type: { buckets: { _id: string; count: number }[] }
          level: { buckets: { _id: string; count: number }[] }
          activity_sector: { buckets: { _id: string; count: number }[] }
          organization_name: { buckets: { _id: string; count: number }[] }
        }
      }>([
        {
          $searchMeta: {
            index: "algolia_search",
            facet: {
              operator: { compound: compoundBaseline },
              facets: {
                type: { type: "string", path: "type" },
                type_filter_label: { type: "string", path: "type_filter_label" },
                contract_type: { type: "string", path: "contract_type" },
                level: { type: "string", path: "level" },
                activity_sector: { type: "string", path: "activity_sector" },
                organization_name: { type: "string", path: "organization_name", numBuckets: 100 },
              },
            },
          },
        },
      ])
      .toArray(),
  ])

  const nbHits = rows[0]?._meta?.count?.total ?? 0
  const nbPages = Math.ceil(nbHits / hitsPerPage)

  const hits: SearchHit[] = rows.map(({ highlights, _meta: _m, ...doc }) => ({
    ...(doc as IAlgolia),
    preview: buildPreviewText(highlights ?? []),
    matched_words: buildSearchMatchWords(highlights ?? []),
  }))

  const metaResult = meta[0]
  const facets: ISearchFacets | undefined = metaResult?.facet
    ? {
        type: Object.fromEntries(metaResult.facet.type.buckets.map((b) => [b._id, b.count])),
        type_filter_label: Object.fromEntries(metaResult.facet.type_filter_label.buckets.map((b) => [b._id, b.count])),
        contract_type: Object.fromEntries(metaResult.facet.contract_type.buckets.map((b) => [b._id, b.count])),
        level: Object.fromEntries(metaResult.facet.level.buckets.map((b) => [b._id, b.count])),
        activity_sector: Object.fromEntries(metaResult.facet.activity_sector.buckets.map((b) => [b._id, b.count])),
        organization_name: Object.fromEntries(metaResult.facet.organization_name.buckets.map((b) => [b._id, b.count])),
      }
    : undefined

  return { hits, nbHits, page, nbPages, facets }
}
