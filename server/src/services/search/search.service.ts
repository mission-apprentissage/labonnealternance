import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import type { ISearchItem } from "shared/models/index"

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

type SearchRow = ISearchItem & {
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

// ─── Tokenisation de la requête (couverture par terme) ─────────────────────────────────────
// Mots vides : grammaticaux FR courts + marqueurs génériques du domaine (apprenti, alternance,
// h/f) présents dans quasi toutes les offres → aucun pouvoir discriminant, mais ils gonflent
// le compte de termes exigés par minimumShouldMatch.
const QUERY_STOPWORDS = new Set([
  "a",
  "au",
  "aux",
  "avec",
  "ce",
  "ces",
  "chez",
  "d",
  "dans",
  "de",
  "des",
  "du",
  "en",
  "et",
  "f",
  "h",
  "hf",
  "l",
  "la",
  "le",
  "les",
  "ou",
  "par",
  "pour",
  "sur",
  "un",
  "une",
  "apprenti",
  "alternant",
  "alternance",
  "apprentissage",
])

const QUERY_DIACRITICS = /[̀-ͯ]/g
export const normalizeTerm = (s: string) => s.normalize("NFD").replace(QUERY_DIACRITICS, "").toLowerCase()

// Clé de déduplication : replie les variantes plurielles et masculin/féminin des intitulés
// ROME ("Cuisinier / Cuisinière", "Moniteur éducateur / Monitrice éducatrice") sur une même
// clé. Heuristique volontairement simple — la clé ne sert QUE à comparer les termes d'une
// même requête, jamais au matching (le terme original part tel quel vers l'analyzer).
const dedupKey = (normalized: string): string => {
  let t = normalized
  if (t.length > 3 && t.endsWith("s")) t = t.slice(0, -1)
  t = t
    .replace(/trice$/, "teur")
    .replace(/euse$/, "eur")
    .replace(/elle$/, "el")
    .replace(/enne$/, "en")
    .replace(/iere$/, "ier")
    .replace(/ere$/, "er")
  if (t.length > 3 && t.endsWith("e")) t = t.slice(0, -1)
  return t
}

/** Découpe la requête en termes utiles : minuscules, split non-alphanumérique, stopwords, dédup M/F. */
export function tokenizeQuery(q: string): string[] {
  const seen = new Set<string>()
  const terms: string[] = []
  for (const raw of q.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
    if (!raw) continue
    const normalized = normalizeTerm(raw)
    const key = dedupKey(normalized)
    if (QUERY_STOPWORDS.has(normalized) || QUERY_STOPWORDS.has(key) || seen.has(key)) continue
    seen.add(key)
    terms.push(raw)
  }
  return terms
}

// Fuzzy par longueur de terme : pas de fuzzy sur les termes courts (un acronyme comme "esf" ne
// doit pas matcher "ESG" à 1 edit), préfixe protégé plus long sur les termes moyens.
const fuzzyFor = (term: string): { maxEdits: number; prefixLength: number } | undefined => {
  if (term.length <= 4) return undefined
  if (term.length <= 7) return { maxEdits: 1, prefixLength: 2 }
  return { maxEdits: 1, prefixLength: 1 }
}

// Nombre minimal de termes couverts exigé : tous jusqu'à 2 termes, n−1 pour 3-4, 75 % au-delà.
const msmFor = (n: number): number => (n <= 2 ? n : n <= 4 ? n - 1 : Math.ceil(0.75 * n))

// Sémantique INCLUSIVE du filtre niveau : un doc sans niveau précisé ("" — recruteurs et
// offres sans diplôme cible, ~83 % du corpus) ou "Indifférent" (fallback formations) est
// compatible avec tout niveau sélectionné — il n'est pas incompatible, il est indifférent.
const LEVEL_AGNOSTIC_VALUES = ["", "Indifférent"]
const buildLevelFilter = (level: string[]) => ({ in: { path: "level", value: [...level, ...LEVEL_AGNOSTIC_VALUES] } })

// Clause de couverture d'UN terme : le terme est cherché sur tous les champs pondérés
// (boosting par champ), + l'index autocomplete (edgeGram) pour les abréviations/troncatures
// ("compta" → "comptable"). Un doc "couvre" le terme s'il matche au moins un champ.
function buildTermCoverageClause(term: string): object {
  const fuzzy = fuzzyFor(term)
  const text = (path: string, boost: number) => ({ text: { query: term, path, ...(fuzzy ? { fuzzy } : {}), score: { boost: { value: boost } } } })
  return {
    compound: {
      should: [
        text("rome_labels", 8),
        text("title", 7),
        // organization_name SANS fuzzy : sur des noms propres, l'édition à 1 caractère produit
        // des faux positifs massifs ("vigile" → VIRGILE, VIGIER, VIEILLE…). L'analyzer
        // lba_company gère déjà casse et accents ; description exclue de la couverture (bonus
        // de score seulement, cf. buildTextBonusClauses) : un terme mentionné uniquement dans
        // la description ne suffit pas à faire entrer le doc dans le result set.
        { text: { query: term, path: "organization_name", score: { boost: { value: 6 } } } },
        text("keywords", 5),
        { autocomplete: { query: term, path: "title", score: { boost: { value: 3 } } } },
        { autocomplete: { query: term, path: "rome_labels", score: { boost: { value: 3 } } } },
      ],
      minimumShouldMatch: 1,
    },
  }
}

/**
 * Porte de pertinence (bloc `must`) : structure « une clause de couverture par terme » +
 * minimumShouldMatch dynamique. Un doc n'entre dans le result set que s'il couvre assez de
 * termes — OU s'il matche la requête ENTIÈRE via la collection de synonymes (les groupes sont
 * multi-mots : "mco" ↔ "management commercial opérationnel" ; la clause synonymes sert donc
 * d'alternative de couverture, avec un boost aligné sur les matchs directs).
 * NB $search : `synonyms` et `fuzzy` sont mutuellement exclusifs sur une même clause `text` —
 * la structure les sépare (fuzzy dans les clauses par terme, synonymes sur la requête entière).
 */
function buildTextGate(q?: string): object | null {
  if (!q?.trim()) return null
  const terms = tokenizeQuery(q)
  const coverage = terms.length ? [{ compound: { should: terms.map(buildTermCoverageClause), minimumShouldMatch: msmFor(terms.length) } }] : []
  const synonyms = { text: { query: q, path: SYNONYM_MULTI_PATHS, synonyms: "lba_synonyms", score: { boost: { value: 6 } } } }
  return { compound: { should: [...coverage, synonyms], minimumShouldMatch: 1 } }
}

// Bonus de score (bloc `should`, n'élargit pas le result set) : adjacence/ordre des termes.
// phrase sur title/rome_labels départage "Product Manager" des docs aux termes épars ; phrase
// sur organization_name fait dominer le match employeur sur les mentions en description ;
// text sur description départage les docs qui couvrent aussi le sujet dans leur descriptif
// (le champ n'est plus une voie d'entrée dans le result set, seulement un signal de classement).
function buildTextBonusClauses(q?: string): object[] {
  if (!q?.trim()) return []
  return [
    { phrase: { query: q, path: ["title", "rome_labels"], slop: 2, score: { boost: { value: 10 } } } },
    { phrase: { query: q, path: "organization_name", slop: 1, score: { boost: { value: 8 } } } },
    { text: { query: q, path: "description", score: { boost: { value: 1 } } } },
  ]
}

function buildCompoundOperator(filters: ISearchFilters) {
  const { q, type, type_filter_label, contract_type, level, activity_sector, organization_name, sort, latitude, longitude, radius } = filters
  const hasGeo = latitude !== undefined && longitude !== undefined
  const proximity = sort === "proximity" && hasGeo

  const gate = buildTextGate(q)

  const filter: object[] = []

  if (type) filter.push({ equals: { path: "type", value: type } })
  if (type_filter_label?.length) filter.push({ in: { path: "type_filter_label", value: type_filter_label } })
  if (contract_type?.length) filter.push({ in: { path: "contract_type", value: contract_type } })
  if (level?.length) filter.push(buildLevelFilter(level))
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

  // Tri par date : la publication_date des recruteurs_lba est une date d'IMPORT (souvent plus
  // récente que toutes les offres) — une candidature spontanée n'a pas de date de publication
  // réelle, elle monopoliserait la tête du tri. On l'exclut, ainsi que les docs sans date
  // indexée (formations sans publication_date : null n'est pas indexé → exists les écarte).
  const mustNot: object[] = []
  if (sort === "date") {
    mustNot.push({ equals: { path: "sub_type", value: LBA_ITEM_TYPE.RECRUTEURS_LBA } })
    filter.push({ exists: { path: "publication_date" } })
  }

  // Tri par proximité : la porte de pertinence devient un filtre, et le score provient
  // de l'opérateur `near` (plus c'est proche, plus le score est élevé). Le tri
  // par score restitue donc les résultats du plus proche au plus lointain.
  if (proximity) {
    if (gate) filter.push(gate)
    // `near` en `must` : matche tous les docs et donne un score décroissant avec la
    // distance. pivot = 1 km → score très sensible à la distance (tri ~ proche d'abord).
    const near = { near: { path: "location", origin: { type: "Point", coordinates: [longitude, latitude] }, pivot: 1000 } }
    if (!filter.length) filter.push({ exists: { path: "type" } })
    return { must: [near], filter }
  }

  if (!gate && !filter.length) {
    filter.push({ exists: { path: "type" } })
  }

  // Porte de pertinence en `must` (gate le result set — vaut pour TOUS les tris, y compris
  // date : un doc trop peu couvrant n'apparaît plus, quel que soit l'ordre) ; bonus phrase
  // en `should` pur (score uniquement, n'élargit pas les résultats).
  return { ...(gate ? { must: [gate], should: buildTextBonusClauses(q) } : {}), filter, ...(mustNot.length ? { mustNot } : {}) }
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
  // Même porte de pertinence que la recherche → les counts de facettes reflètent le même result set.
  const gate = buildTextGate(q)
  const filter: object[] = []

  if (type) filter.push({ equals: { path: "type", value: type } })
  if (exclude !== "type_filter_label" && type_filter_label?.length) filter.push({ in: { path: "type_filter_label", value: type_filter_label } })
  if (exclude !== "contract_type" && contract_type?.length) filter.push({ in: { path: "contract_type", value: contract_type } })
  if (exclude !== "level" && level?.length) filter.push(buildLevelFilter(level))
  if (exclude !== "activity_sector" && activity_sector?.length) filter.push({ in: { path: "activity_sector", value: activity_sector } })
  if (exclude !== "organization_name" && organization_name) filter.push({ equals: { path: "organization_name", value: organization_name } })
  if (hasGeo) filter.push({ geoWithin: { circle: { center: { type: "Point", coordinates: [longitude, latitude] }, radius: radius * 1000 }, path: "location" } })

  // Même exclusion qu'en recherche pour le tri par date → les counts de facettes reflètent le result set réel.
  const mustNot: object[] = []
  if (filters.sort === "date") {
    mustNot.push({ equals: { path: "sub_type", value: LBA_ITEM_TYPE.RECRUTEURS_LBA } })
    filter.push({ exists: { path: "publication_date" } })
  }

  if (!gate && !filter.length) filter.push({ exists: { path: "type" } })
  return { ...(gate ? { must: [gate] } : {}), filter, ...(mustNot.length ? { mustNot } : {}) }
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

export type SearchHit = ISearchItem & {
  preview: PreviewItem[]
  matched_words: Array<{ word: string; count: number }>
  distance: number | null
}

export async function searchItems(params: ISearchFilters): Promise<{
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
    getDbCollection("search_items")
      .aggregate<SearchRow>([
        {
          $search: {
            index: "search_items_index",
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
      getDbCollection("search_items")
        .aggregate<FacetMetaRow>([
          {
            $searchMeta: {
              index: "search_items_index",
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
    const itemDoc = doc as ISearchItem
    const distance =
      hasGeo && itemDoc.location
        ? getDistanceInKm({
            origin: { latitude, longitude },
            destination: { latitude: itemDoc.location.coordinates[1], longitude: itemDoc.location.coordinates[0] },
          })
        : null
    return {
      ...itemDoc,
      // Champs d'enrichissement ajoutés après coup (rome_labels, keywords) : absents des docs
      // seedés antérieurs → on force la clé à null pour satisfaire le schéma `.nullable()`
      // (sinon `undefined` → erreur de sérialisation Zod → 500).
      keywords: itemDoc.keywords ?? null,
      rome_labels: itemDoc.rome_labels ?? null,
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

// Autocomplétion sur le contenu indexé (title + rome_labels, edgeGram).
async function suggestFromItems(q: string, limit: number): Promise<string[]> {
  const rows = await getDbCollection("search_items")
    .aggregate<{ title: string; rome_labels: string[] | null }>([
      {
        $search: {
          index: "search_items_index",
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
  return rows.flatMap((row) => [row.title, ...(row.rome_labels ?? [])])
}

// Autocomplétion sur les suggestions issues des recherches utilisateurs (collection
// `search_suggestions`, alimentée par le job analyzeSearchQueries — seuls les termes
// `active` sont servis ; kill-switch : passer origin user_queries en disabled).
async function suggestFromUserSuggestions(q: string, limit: number): Promise<string[]> {
  const rows = await getDbCollection("search_suggestions")
    .aggregate<{ term: string }>([
      {
        $search: {
          index: "search_suggestions_index",
          compound: {
            must: [{ autocomplete: { query: q, path: "term", fuzzy: { maxEdits: 1 } } }],
            filter: [{ equals: { path: "status", value: "active" } }],
          },
        },
      },
      { $limit: limit },
      { $project: { _id: 0, term: 1 } },
    ])
    .toArray()
  return rows.map((row) => row.term)
}

/**
 * Autocomplétion par préfixe pour la barre de recherche : fusionne le contenu réellement
 * indexé (title/rome_labels — prioritaire) et les suggestions apprises des recherches
 * utilisateurs (en complément jusqu'à `limit`). Les deux requêtes $search partent en
 * parallèle ; la déduplication et le filtre anti-bruit fuzzy s'appliquent aux deux listes.
 */
export async function suggestSearchTerms({ q, limit }: { q: string; limit: number }): Promise<{ suggestions: string[] }> {
  const [itemCandidates, userCandidates] = await Promise.all([
    suggestFromItems(q, limit),
    // La collection peut ne pas exister / index absent (env de test) → dégradation silencieuse.
    suggestFromUserSuggestions(q, limit).catch(() => [] as string[]),
  ])

  // Normalisation (minuscules + sans accents) pour le filtrage et la déduplication.
  const diacritics = new RegExp("[\\u0300-\\u036f]", "g")
  const normalize = (s: string) => s.normalize("NFD").replace(diacritics, "").toLowerCase().trim()
  const normalizedQuery = normalize(q)

  // On ne garde que les intitulés contenant réellement la saisie (évite le bruit fuzzy/indirect),
  // dédupliqués en préservant l'ordre de pertinence — contenu indexé d'abord.
  const seen = new Set<string>()
  const suggestions: string[] = []
  for (const candidate of [...itemCandidates, ...userCandidates]) {
    const value = candidate?.trim()
    if (!value) continue
    const normalized = normalize(value)
    if (!normalized.includes(normalizedQuery) || seen.has(normalized)) continue
    seen.add(normalized)
    suggestions.push(value)
    if (suggestions.length >= limit) return { suggestions }
  }
  return { suggestions }
}
