import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import type { ISearchItem } from "shared/models/index"
import { JOB_START_TYPE } from "shared/models/job.model"
import { parseAdminArea } from "shared/utils/admin-area"
import { getDistanceInKm } from "@/common/utils/geolib"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import { buildAdminAreaClause } from "@/services/geo-administrative/admin-area"
import { retryOnTransientSearchCancellation } from "@/services/search/search-transient-retry"

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

type SortOption = "proximity" | "date" | "applications" | "start_date"

export type SearchMode = "emplois" | "formations" | "emplois_formation"

export const DEFAULT_SEARCH_MODE: SearchMode = "emplois"

interface ISearchFilters {
  q?: string
  type?: string
  mode?: SearchMode
  type_filter_label?: string[]
  contract_type?: string[]
  level?: string[]
  activity_sector?: string[]
  organization_name?: string
  is_disabled_elligible?: boolean
  start_type?: JOB_START_TYPE
  start_date?: Date
  smart_apply?: boolean
  is_algo_company?: boolean
  sort?: SortOption
  latitude?: number
  longitude?: number
  radius: number
  page: number
  hitsPerPage: number
  /**
   * Emprise administrative ("region:53", "departement:44") quand la saisie désigne un département
   * ou une région (cf. ban-plateforme#781). Prioritaire sur latitude/longitude/radius pour le
   * filtrage ; la paire lat/lon reste utilisée pour le tri par proximité et la distance affichée.
   */
  admin_area?: string
}

interface ISearchFacets {
  type: Record<string, number>
  sub_type: Record<string, number>
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

// Chemins de la clause synonymes : title + rome_labels uniquement. La clause matche la
// requête BRUTE en plus des expansions — l'étendre à description/keywords rouvrirait une
// porte dérobée dans le result set (un keyword générique suffisait à faire entrer un doc,
// recette #3). Les expansions du référentiel sont des intitulés métier : ils vivent dans
// title/rome_labels.
const SYNONYM_MULTI_PATHS = [
  { value: "title", multi: "standard" },
  { value: "rome_labels", multi: "standard" },
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

// Mots de diplôme : très fréquents dans les titres/descriptions d'offres, ils couvrent sans
// discriminer le métier ("bac pro commerce" matchait carrossier/serveur via bac + pro, recette #3).
// Le niveau se filtre par la facette dédiée ; le bonus phrase (requête entière) continue de
// favoriser les intitulés exacts type "Bac pro commerce". Hors mode emplois, cf. DiplomaTermsPolicy.
const DIPLOMA_WORDS = new Set(["bac", "bachelor", "bp", "bts", "but", "cap", "deust", "diplome", "dut", "licence", "master", "mastere", "pro"])

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

const isStopword = (normalized: string) => QUERY_STOPWORDS.has(normalized) || DIPLOMA_WORDS.has(normalized)

/**
 * Découpe la requête en termes utiles : minuscules, split non-alphanumérique, stopwords, dédup M/F.
 * `diplomaWords: true` ne garde au contraire que les mots de diplôme (cf. DiplomaTermsPolicy).
 * Aussi clé d'agrégation de `search_queries` (search-query-log.service.ts), indépendante du mode.
 */
export function tokenizeQuery(q: string, { diplomaWords = false }: { diplomaWords?: boolean } = {}): string[] {
  const seen = new Set<string>()
  const terms: string[] = []
  for (const raw of q.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
    if (!raw) continue
    const normalized = normalizeTerm(raw)
    const key = dedupKey(normalized)
    const skip = diplomaWords ? !DIPLOMA_WORDS.has(normalized) && !DIPLOMA_WORDS.has(key) : isStopword(normalized) || isStopword(key)
    if (skip || seen.has(key)) continue
    seen.add(key)
    terms.push(raw)
  }
  return terms
}

// Fuzzy par longueur de terme : réservé aux termes longs (≥ 8). Sur les termes courts et
// moyens, 1 edit change le mot : "esf" → "ESG", "vente" → "verte" (paysagistes),
// "product" → "produits", "manager" → "manger" (recette #3). Préfixe protégé de 2 pour
// éviter les dérives en début de mot.
const fuzzyFor = (term: string): { maxEdits: number; prefixLength: number } | undefined => {
  if (term.length <= 7) return undefined
  return { maxEdits: 1, prefixLength: 2 }
}

const msmFor = (n: number): number => (n <= 2 ? n : n <= 4 ? n - 1 : Math.ceil(0.75 * n))

// « A une vraie valeur » : seule une valeur indexée matche un range. `exists` est inutilisable
// ici : il matche aussi les champs à null, donc tous les docs.
const HAS_START_DATE = { range: { path: "start_date", gte: new Date("1900-01-01T00:00:00.000Z") } }
// Offres sans `offer_creation` : publication_date nulle dans les corpus d'offres aussi.
const HAS_PUBLICATION_DATE = { range: { path: "publication_date", gte: new Date("1900-01-01T00:00:00.000Z") } }

// Tri par date de début : les docs sans start_date trieraient en tête (valeur manquante avant
// toute date en ordre croissant), on les écarte, sauf les candidatures spontanées (cf. buildSortStage).
const START_DATE_SORT_FILTER = {
  compound: {
    should: [HAS_START_DATE, { equals: { path: "is_algo_company", value: true } }],
    minimumShouldMatch: 1,
  },
}

// Filtre date de début : offres qui démarrent au plus tard à cette date, à date flexible, et
// docs sans date (candidatures spontanées, formations), non concernés par le critère.
const buildStartDateFilter = (start_date: Date) => ({
  compound: {
    should: [
      { range: { path: "start_date", lte: start_date } },
      { equals: { path: "is_start_flexible", value: true } },
      // Un compound purement négatif ne matche rien (Lucene) → clause positive d'ancrage
      // (`type` est indexé sur tous les docs).
      { compound: { must: [{ exists: { path: "type" } }], mustNot: [HAS_START_DATE] } },
    ],
    minimumShouldMatch: 1,
  },
})

/**
 * Traitement des mots de diplôme (DIPLOMA_WORDS) par corpus :
 * - "stopword" (emplois) : ignorés, ils couvrent sans discriminer le métier ;
 * - "qualifier" (formations, emplois avec formation incluse, dont les titres ressemblent à des
 *   intitulés de formation : « BTS MCO en alternance ») : bonus de score, et porte de pertinence
 *   seulement quand la requête n'a pas d'autre terme (« bts »). Les compter comme des termes
 *   ordinaires laisserait « bac pro commerce » ramener « Bac pro cuisine » via bac + pro.
 */
type DiplomaTermsPolicy = "stopword" | "qualifier"

// Un mode = un corpus : sa collection, son index Atlas Search et ses réglages (#5389). La
// répartition des items entre collections suit getSearchCorpusCollection (search-items.service.ts).
const SEARCH_CORPORA = {
  emplois: { collection: "search_jobs", index: "search_jobs_index", diplomaTerms: "stopword" },
  emplois_formation: { collection: "search_jobs_with_training", index: "search_jobs_with_training_index", diplomaTerms: "qualifier" },
  formations: { collection: "search_trainings", index: "search_trainings_index", diplomaTerms: "qualifier" },
} as const satisfies Record<SearchMode, { collection: string; index: string; diplomaTerms: DiplomaTermsPolicy }>

type SearchCorpus = (typeof SEARCH_CORPORA)[SearchMode]

// Sémantique INCLUSIVE du filtre niveau : un doc sans niveau précisé ("" — recruteurs et
// offres sans diplôme cible, corpus d'offres) ou "Indifférent" (niveau inconnu, corpus formations) est
// compatible avec tout niveau sélectionné — il n'est pas incompatible, il est indifférent.
const LEVEL_AGNOSTIC_VALUES = ["", "Indifférent"]
const buildLevelFilter = (level: string[]) => ({ in: { path: "level", value: [...level, ...LEVEL_AGNOSTIC_VALUES] } })

// Un doc « couvre » un terme s'il le matche sur au moins un champ pondéré. Deux différences
// entre mono-terme et multi-termes :
// - autocomplete (edgeGram) en mono-terme seulement : en multi-termes, il couvre par préfixe
//   accidentel (« product » couvert par « production »).
// - keywords (Mistral) : en mono-terme, couverture réservée aux recruteurs, sinon un keyword
//   générique (« commercial ») suffit à faire entrer une offre hors sujet. En multi-termes,
//   msmFor exige déjà les autres termes ailleurs, keywords couvre donc pour tous.
function buildTermCoverageClause(term: string, isSingleTerm: boolean, simplifyQuery: boolean): object {
  const fuzzy = simplifyQuery ? undefined : fuzzyFor(term)
  const text = (path: string, boost: number) => ({ text: { query: term, path, ...(fuzzy ? { fuzzy } : {}), score: { boost: { value: boost } } } })
  return {
    compound: {
      should: [
        text("rome_labels", 8),
        text("title", 7),
        // organization_name sans fuzzy : sur des noms propres, 1 édition donne des faux positifs
        // massifs (« vigile » → VIRGILE, VIGIER). description absente volontairement : bonus de
        // score seulement (buildTextBonusClauses), elle ne fait pas entrer un doc.
        { text: { query: term, path: "organization_name", score: { boost: { value: 6 } } } },
        isSingleTerm ? { compound: { must: [text("keywords", 5)], filter: [{ equals: { path: "sub_type", value: LBA_ITEM_TYPE.RECRUTEURS_LBA } }] } } : text("keywords", 5),
        ...(isSingleTerm
          ? [
              { autocomplete: { query: term, path: "title", score: { boost: { value: 3 } } } },
              { autocomplete: { query: term, path: "rome_labels", score: { boost: { value: 3 } } } },
            ]
          : []),
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
 * Opérateur `phrase` (et non `text`) pour les synonymes : `text` matche l'expansion token par
 * token (« vigile » → « agent de sécurité » laissait entrer tout doc contenant « agent » —
 * agents commerciaux compris, recette #3) ; `phrase` exige la séquence complète du synonyme.
 *
 * `simplifyQuery` (repli sur maxClauseCount dépassé, cf. runSearchAggregations) retire la
 * clause synonymes en plus de désactiver le fuzzy : sur une requête longue et riche en mots
 * courants (ex. intitulé de formation complet), `phrase`+`synonyms` peut À LUI SEUL dépasser
 * la limite — reproduit en isolant cette clause contre mongot (#5153) sur une requête où la
 * couverture par terme, elle, passe sans problème même avec le fuzzy actif. La clause reste
 * peu utile sur ces requêtes de toute façon : `phrase`/`slop:0` exige une correspondance quasi
 * exacte, peu probable sur un texte libre long.
 */
function buildTextGate(q: string | undefined, simplifyQuery: boolean, corpus: SearchCorpus): object | null {
  if (!q?.trim()) return null
  const contentTerms = tokenizeQuery(q)
  const terms = !contentTerms.length && corpus.diplomaTerms === "qualifier" ? tokenizeQuery(q, { diplomaWords: true }) : contentTerms
  const coverage = terms.length
    ? [{ compound: { should: terms.map((term) => buildTermCoverageClause(term, terms.length === 1, simplifyQuery)), minimumShouldMatch: msmFor(terms.length) } }]
    : []
  const synonyms = simplifyQuery ? [] : [{ phrase: { query: q, path: SYNONYM_MULTI_PATHS, synonyms: "lba_synonyms", slop: 0, score: { boost: { value: 6 } } } }]
  const should = [...coverage, ...synonyms]
  // simplifyQuery peut vider les deux voies d'entrée à la fois (q composé uniquement de
  // stopwords, sans la clause synonymes — qui opère sur le q brut, pas sur `terms` — pour
  // compenser) : un compound `should: []` est un comportement $search non défini côté mongot.
  // Repli sur « pas de porte de pertinence », comme pour un q vide.
  return should.length ? { compound: { should, minimumShouldMatch: 1 } } : null
}

// Bonus de score (bloc `should`, n'élargit pas le result set). phrase sur title/rome_labels
// favorise les termes adjacents (« Product Manager ») ; phrase sur organization_name fait
// passer le match employeur devant les mentions en description.
function buildTextBonusClauses(q: string | undefined, corpus: SearchCorpus): object[] {
  if (!q?.trim()) return []
  const diplomaTerms = corpus.diplomaTerms === "qualifier" ? tokenizeQuery(q, { diplomaWords: true }) : []
  return [
    { phrase: { query: q, path: ["title", "rome_labels"], slop: 2, score: { boost: { value: 10 } } } },
    { phrase: { query: q, path: "organization_name", slop: 1, score: { boost: { value: 8 } } } },
    { text: { query: q, path: "keywords", score: { boost: { value: 3 } } } },
    { text: { query: q, path: "description", score: { boost: { value: 1 } } } },
    ...(diplomaTerms.length ? [{ text: { query: diplomaTerms.join(" "), path: "title", score: { boost: { value: 7 } } } }] : []),
  ]
}

/**
 * Restriction géographique de la recherche. L'emprise administrative prime sur le point + rayon :
 * un département n'est pas un disque, et le rayon qui le couvre ramène 51 à 82 % de résultats
 * hors périmètre selon l'entité (mesures dans tools/geo-781). Un `admin_area` mal formé est
 * ignoré plutôt que rejeté : la route l'a déjà validé, et une valeur inconnue du référentiel
 * donne simplement zéro résultat sur le token.
 */
function buildGeoClause(filters: ISearchFilters): object | null {
  const adminArea = parseAdminArea(filters.admin_area)
  if (adminArea) return buildAdminAreaClause(adminArea)
  const { latitude, longitude, radius } = filters
  if (latitude === undefined || longitude === undefined) return null
  return {
    geoWithin: {
      circle: { center: { type: "Point", coordinates: [longitude, latitude] }, radius: radius * 1000 },
      path: "location",
    },
  }
}

function buildCompoundOperator(filters: ISearchFilters, corpus: SearchCorpus, simplifyQuery: boolean) {
  const {
    q,
    type_filter_label,
    contract_type,
    level,
    activity_sector,
    organization_name,
    is_disabled_elligible,
    start_type,
    start_date,
    smart_apply,
    is_algo_company,
    sort,
    latitude,
    longitude,
  } = filters
  const hasGeo = latitude !== undefined && longitude !== undefined
  const proximity = sort === "proximity" && hasGeo

  const gate = buildTextGate(q, simplifyQuery, corpus)

  const filter: object[] = []

  if (type_filter_label?.length) filter.push({ in: { path: "type_filter_label", value: type_filter_label } })
  if (contract_type?.length) filter.push({ in: { path: "contract_type", value: contract_type } })
  if (level?.length) filter.push(buildLevelFilter(level))
  if (activity_sector?.length) filter.push({ in: { path: "activity_sector", value: activity_sector } })
  if (organization_name) filter.push({ equals: { path: "organization_name", value: organization_name } })
  if (is_disabled_elligible) filter.push({ equals: { path: "is_disabled_elligible", value: true } })
  if (start_type) filter.push({ equals: { path: "start_type", value: start_type } })
  if (start_date) filter.push(buildStartDateFilter(start_date))
  if (smart_apply) filter.push({ equals: { path: "smart_apply", value: true } })
  // Type d'offres d'emploi : true = entreprises à contacter (candidatures spontanées de
  // l'algo), false = offres d'emploi. Absent = les deux (aucun filtre).
  if (is_algo_company !== undefined) filter.push({ equals: { path: "is_algo_company", value: is_algo_company } })
  const geoClause = buildGeoClause(filters)
  if (geoClause) filter.push(geoClause)

  // Tris sur un champ : les docs sans valeur trieraient en tête (valeur manquante avant toute
  // valeur en ordre croissant), on les écarte. Pas de garde sur application_count : toujours
  // renseigné dans les corpus d'offres, toujours nul dans celui des formations.
  if (sort === "date") {
    filter.push(HAS_PUBLICATION_DATE)
  }
  if (sort === "start_date") {
    filter.push(START_DATE_SORT_FILTER)
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
  return { ...(gate ? { must: [gate], should: buildTextBonusClauses(q, corpus) } : {}), filter }
}

// Les candidatures spontanées (is_algo_company) passent en fin de liste sur les tris par date :
// leur publication_date est une date d'import, et elles n'ont jamais de date de début.
function buildSortStage(filters: ISearchFilters): Record<string, unknown> {
  const hasGeo = filters.latitude !== undefined && filters.longitude !== undefined

  if (filters.sort === "date") {
    return { is_algo_company: { order: 1 }, publication_date: { order: -1 } }
  }
  if (filters.sort === "start_date") {
    return { is_algo_company: { order: 1 }, start_date: { order: 1 }, score: { $meta: "searchScore", order: -1 } }
  }
  if (filters.sort === "applications") {
    // Moins de candidatures d'abord : maximise les chances du candidat et répartit les
    // candidatures (même philosophie que le tie-break du tri par défaut).
    return { application_count: { order: 1 }, score: { $meta: "searchScore", order: -1 } }
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

const FACET_DIMENSIONS = ["type_filter_label", "contract_type", "level", "activity_sector", "organization_name"] as const
type FacetDimension = (typeof FACET_DIMENSIONS)[number]

const FACET_FIELD_DEFS: Record<string, object> = {
  type: { type: "string", path: "type" },
  sub_type: { type: "string", path: "sub_type" },
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
function buildFacetCompound(filters: ISearchFilters, corpus: SearchCorpus, exclude: FacetDimension | null, simplifyQuery: boolean) {
  const { q, type_filter_label, contract_type, level, activity_sector, organization_name, is_disabled_elligible, start_type, start_date, smart_apply, is_algo_company } = filters
  // Même porte de pertinence que la recherche → les counts de facettes reflètent le même result set.
  const gate = buildTextGate(q, simplifyQuery, corpus)
  const filter: object[] = []

  if (exclude !== "type_filter_label" && type_filter_label?.length) filter.push({ in: { path: "type_filter_label", value: type_filter_label } })
  if (exclude !== "contract_type" && contract_type?.length) filter.push({ in: { path: "contract_type", value: contract_type } })
  if (exclude !== "level" && level?.length) filter.push(buildLevelFilter(level))
  if (exclude !== "activity_sector" && activity_sector?.length) filter.push({ in: { path: "activity_sector", value: activity_sector } })
  if (exclude !== "organization_name" && organization_name) filter.push({ equals: { path: "organization_name", value: organization_name } })
  // Pas des dimensions de facette (jamais exclues) : ils restreignent toujours les counts.
  if (is_disabled_elligible) filter.push({ equals: { path: "is_disabled_elligible", value: true } })
  if (start_type) filter.push({ equals: { path: "start_type", value: start_type } })
  if (start_date) filter.push(buildStartDateFilter(start_date))
  if (smart_apply) filter.push({ equals: { path: "smart_apply", value: true } })
  if (is_algo_company !== undefined) filter.push({ equals: { path: "is_algo_company", value: is_algo_company } })
  const geoClause = buildGeoClause(filters)
  if (geoClause) filter.push(geoClause)

  // Mêmes restrictions qu'en recherche pour les tris → les counts de facettes reflètent le result set réel.
  if (filters.sort === "date") {
    filter.push(HAS_PUBLICATION_DATE)
  }
  if (filters.sort === "start_date") {
    filter.push(START_DATE_SORT_FILTER)
  }

  if (!gate && !filter.length) filter.push({ exists: { path: "type" } })
  return { ...(gate ? { must: [gate] } : {}), filter }
}

type FacetMetaRow = { facet?: Record<string, { buckets: { _id: string; count: number }[] }> }

// Compteurs des chips booléennes (« Employeur handi-accueillant », « Recrutement urgent »,
// « Candidature simplifiée ») : champs boolean/token indexés non facettables (les facettes
// mongot ne supportent que string/number/date) → un count dédié par chip via $searchMeta.
// Disjonctif comme les facettes : le filtre de la chip est exclu de son propre compound
// pour que le compteur reste stable quand l'utilisateur active le filtre.
function buildChipCountCompounds(filters: ISearchFilters, corpus: SearchCorpus, simplifyQuery: boolean) {
  const handi = buildFacetCompound({ ...filters, is_disabled_elligible: undefined }, corpus, null, simplifyQuery)
  handi.filter.push({ equals: { path: "is_disabled_elligible", value: true } })

  const urgent = buildFacetCompound({ ...filters, start_type: undefined }, corpus, null, simplifyQuery)
  urgent.filter.push({ equals: { path: "start_type", value: JOB_START_TYPE.DES_QUE_POSSIBLE } })

  const smartApply = buildFacetCompound({ ...filters, smart_apply: undefined }, corpus, null, simplifyQuery)
  smartApply.filter.push({ equals: { path: "smart_apply", value: true } })

  return { is_disabled_elligible: handi, urgent, smart_apply: smartApply }
}

// Construit les groupes de $searchMeta minimisant le nombre de requêtes :
// - 1 groupe pour toutes les dimensions NON sélectionnées (+ `type` et `sub_type`,
//   compteurs informatifs — sub_type alimente le détail par type d'offre de l'événement
//   Matomo search_results_displayed), calculé avec tous les filtres actifs ;
// - 1 groupe par dimension sélectionnée, calculé en excluant cette dimension.
function buildFacetGroups(filters: ISearchFilters, corpus: SearchCorpus, simplifyQuery: boolean): { keys: string[]; compound: object }[] {
  const activeDims = FACET_DIMENSIONS.filter((k) => isDimensionActive(filters, k))
  const inactiveDims = FACET_DIMENSIONS.filter((k) => !activeDims.includes(k))

  const groups: { keys: string[]; compound: object }[] = [{ keys: [...inactiveDims, "type", "sub_type"], compound: buildFacetCompound(filters, corpus, null, simplifyQuery) }]
  for (const dim of activeDims) groups.push({ keys: [dim], compound: buildFacetCompound(filters, corpus, dim, simplifyQuery) })
  return groups
}

export type SearchHit = ISearchItem & {
  preview: PreviewItem[]
  matched_words: Array<{ word: string; count: number }>
  distance: number | null
}

// TEMPORAIRE — mongot n'est actif que sur le primaire du cluster prod (rollout des
// secondaires en cours) : un $search servi par un secondaire sans mongot échoue en
// SearchNotEnabled (Sentry LBA-SERVER-5J7KF4ZZZT961). Épingle toutes les agrégations
// $search/$searchMeta sur le primaire ; à retirer une fois mongot déployé sur tous les
// membres du replica set (la répartition de charge sur les secondaires redeviendra souhaitable).
const SEARCH_AGGREGATE_OPTIONS = { readPreference: "primary" } as const

// mongot n'expose aucun réglage pour relever cette limite (vérifié dans les deux repos d'infra).
// Clauses en cause : cf. le docblock de buildTextGate (#5153).
function isMaxClauseCountError(err: unknown): boolean {
  return err instanceof Error && err.message.includes("maxClauseCount")
}

/**
 * Mode servi par une requête. Sans `mode`, le paramètre `type` historique désigne le corpus
 * (`type=formation` → formations) ; il ne filtre plus rien, chaque corpus étant homogène.
 */
export const resolveSearchMode = ({ mode, type }: Pick<ISearchFilters, "mode" | "type">): SearchMode => mode ?? (type === "formation" ? "formations" : DEFAULT_SEARCH_MODE)

async function runSearchAggregations(params: ISearchFilters, simplifyQuery: boolean) {
  const { page, hitsPerPage } = params
  const corpus = SEARCH_CORPORA[resolveSearchMode(params)]
  const compound = buildCompoundOperator(params, corpus, simplifyQuery)
  const facetGroups = buildFacetGroups(params, corpus, simplifyQuery)
  const chipCountCompounds = buildChipCountCompounds(params, corpus, simplifyQuery)
  const chipCountKeys = Object.keys(chipCountCompounds) as (keyof typeof chipCountCompounds)[]

  // Retry unique si mongot annule une des requêtes (transitoire — cf. search-transient-retry.ts) ;
  // relancer l'ensemble est sans risque, ce ne sont que des lectures.
  const [rows, chipCountArrays, ...metaArrays] = await retryOnTransientSearchCancellation(
    () =>
      Promise.all([
        getDbCollection(corpus.collection)
          .aggregate<SearchRow>(
            [
              {
                $search: {
                  index: corpus.index,
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
            ],
            SEARCH_AGGREGATE_OPTIONS
          )
          .toArray(),

        Promise.all(
          chipCountKeys.map((key) =>
            getDbCollection(corpus.collection)
              .aggregate<{ count?: { total?: number } }>(
                [
                  {
                    $searchMeta: {
                      index: corpus.index,
                      compound: chipCountCompounds[key],
                      count: { type: "total" },
                    },
                  },
                ],
                SEARCH_AGGREGATE_OPTIONS
              )
              .toArray()
          )
        ),

        ...facetGroups.map((group) =>
          getDbCollection(corpus.collection)
            .aggregate<FacetMetaRow>(
              [
                {
                  $searchMeta: {
                    index: corpus.index,
                    facet: {
                      operator: { compound: group.compound },
                      facets: Object.fromEntries(group.keys.map((key) => [key, FACET_FIELD_DEFS[key]])),
                    },
                  },
                },
              ],
              SEARCH_AGGREGATE_OPTIONS
            )
            .toArray()
        ),
      ]),
    { q: params.q }
  )

  return { rows, chipCountArrays, metaArrays, facetGroups, chipCountKeys }
}

export async function searchItems(params: ISearchFilters): Promise<{
  hits: SearchHit[]
  nbHits: number
  page: number
  nbPages: number
  facets?: ISearchFacets
  counts?: { is_disabled_elligible: number; urgent: number; smart_apply: number }
  // Repli maxClauseCount déclenché (cf. #5153) — pas dans le schéma de réponse publique
  // (strippé par le type provider zod), lu uniquement par le contrôleur pour search_queries.
  degraded?: boolean
}> {
  const { page, hitsPerPage, latitude, longitude } = params

  let aggregations: Awaited<ReturnType<typeof runSearchAggregations>>
  let degraded = false
  try {
    aggregations = await runSearchAggregations(params, false)
  } catch (err) {
    if (!isMaxClauseCountError(err)) throw err
    // Repli plutôt qu'un 500 : on retente sans fuzzy ni synonymes. Warning Sentry pour suivre la
    // fréquence du repli sans polluer le triage des vraies erreurs.
    sentryCaptureException(err, { level: "warning", extra: { q: params.q, fallback: "search-simplify-query" } })
    aggregations = await runSearchAggregations(params, true)
    degraded = true
  }
  const { rows, chipCountArrays, metaArrays, facetGroups, chipCountKeys } = aggregations

  const nbHits = rows[0]?._meta?.count?.total ?? 0
  const nbPages = Math.ceil(nbHits / hitsPerPage)

  // Pas de distance affichée pour une recherche par emprise : elle serait mesurée depuis le
  // centroïde de la région ou du département (« 137 km du lieu de recherche » pour « Bretagne »),
  // vraie et trompeuse. La paire lat/lon reste utilisée par le tri de proximité.
  const hasGeo = latitude !== undefined && longitude !== undefined && !parseAdminArea(params.admin_area)

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

  const facets: ISearchFacets = { type: {}, sub_type: {}, type_filter_label: {}, contract_type: {}, level: {}, activity_sector: {}, organization_name: {} }
  metaArrays.forEach((arr, i) => {
    const facet = arr[0]?.facet
    if (!facet) return
    for (const key of facetGroups[i].keys) {
      const buckets = facet[key]?.buckets ?? []
      facets[key as keyof ISearchFacets] = Object.fromEntries(buckets.map((b) => [b._id, b.count]))
    }
  })

  const counts = Object.fromEntries(chipCountKeys.map((key, i) => [key, chipCountArrays[i][0]?.count?.total ?? 0])) as Record<
    keyof ReturnType<typeof buildChipCountCompounds>,
    number
  >

  return { hits, nbHits, page, nbPages, facets, counts, degraded }
}

async function suggestFromItems(q: string, limit: number, corpus: SearchCorpus): Promise<string[]> {
  const rows = await retryOnTransientSearchCancellation(
    () =>
      getDbCollection(corpus.collection)
        .aggregate<{ title: string; rome_labels: string[] | null }>(
          [
            {
              $search: {
                index: corpus.index,
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
          ],
          SEARCH_AGGREGATE_OPTIONS
        )
        .toArray(),
    { q, source: "suggest" }
  )
  return rows.flatMap((row) => [row.title, ...(row.rome_labels ?? [])])
}

// Autocomplétion sur les suggestions issues des recherches utilisateurs (collection
// `search_suggestions`, alimentée par le job analyzeSearchQueries — seuls les termes
// `active` sont servis ; kill-switch : passer origin user_queries en disabled). En mode emplois,
// les termes classés `formation` sont écartés pour la même raison que les intitulés RCO (#5389).
async function suggestFromUserSuggestions(q: string, limit: number, mode: SearchMode): Promise<string[]> {
  const rows = await getDbCollection("search_suggestions")
    .aggregate<{ term: string }>(
      [
        {
          $search: {
            index: "search_suggestions_index",
            compound: {
              must: [{ autocomplete: { query: q, path: "term", fuzzy: { maxEdits: 1 } } }],
              filter: [{ equals: { path: "status", value: "active" } }],
              ...(mode === "emplois" ? { mustNot: [{ equals: { path: "category", value: "formation" } }] } : {}),
            },
          },
        },
        { $limit: limit },
        { $project: { _id: 0, term: 1 } },
      ],
      SEARCH_AGGREGATE_OPTIONS
    )
    .toArray()
  return rows.map((row) => row.term)
}

/**
 * Autocomplétion par préfixe pour la barre de recherche : fusionne le contenu réellement
 * indexé du corpus du mode (title/rome_labels — prioritaire) et les suggestions apprises des
 * recherches utilisateurs (en complément jusqu'à `limit`). Les deux requêtes $search partent en
 * parallèle ; la déduplication et le filtre anti-bruit fuzzy s'appliquent aux deux listes.
 */
export async function suggestSearchTerms({ q, limit, mode = DEFAULT_SEARCH_MODE }: { q: string; limit: number; mode?: SearchMode }): Promise<{ suggestions: string[] }> {
  const [itemCandidates, userCandidates] = await Promise.all([
    suggestFromItems(q, limit, SEARCH_CORPORA[mode]),
    // La collection peut ne pas exister / index absent (env de test) → dégradation silencieuse.
    suggestFromUserSuggestions(q, limit, mode).catch(() => [] as string[]),
  ])

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
