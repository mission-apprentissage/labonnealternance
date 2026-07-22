import { toKebabCase } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

export interface ISearchPageParams {
  q?: string
  q_source?: QSource // origine de q : suggestion d'autocomplete sélectionnée vs texte libre (télémétrie)
  lieu_label?: string // label affiché dans le champ lieu (ex: "Paris 75001")
  mode: SearchMode // type de recherche (défaut : emplois uniquement)
  type_filter_label?: string[] // filtre par libellé de type (ex: "Formation à distance")
  contract_type?: string[]
  level?: string[]
  activity_sector?: string[]
  organization_name?: string
  start_date?: string // date de début de contrat souhaitée (YYYY-MM-DD)
  urgent?: boolean // recrutement urgent (start_type=des_que_possible)
  handi?: boolean // employeur handi-accueillant (is_disabled_elligible=true)
  smart_apply?: boolean // candidature simplifiée disponible
  is_algo_company?: boolean // type d'offres : true = entreprises à contacter, false = offres d'emploi, absent = les deux
  sort?: SortOption // tri des résultats (défaut : pertinence)
  latitude?: number
  longitude?: number
  radius: number
  page: number
  hitsPerPage: number
}

export type SearchMode = "emplois" | "formations" | "emplois_formation"
export const SEARCH_MODES: SearchMode[] = ["emplois", "formations", "emplois_formation"]
export const DEFAULT_SEARCH_MODE: SearchMode = "emplois"

export type SortOption = "proximity" | "date" | "applications" | "start_date"
const SORT_OPTIONS: SortOption[] = ["proximity", "date", "applications", "start_date"]

export type QSource = "suggestion" | "free_text"
const Q_SOURCES: QSource[] = ["suggestion", "free_text"]

/**
 * Les filtres multi-valeurs utilisent des paramètres répétés dans l'URL :
 *   ?contract_type=Apprentissage&contract_type=Professionnalisation
 *
 * URLSearchParams encode/décode chaque valeur individuellement → pas de conflit
 * avec des virgules ou caractères spéciaux dans les libellés.
 */
export function parseSearchPageParams(search: URLSearchParams): ISearchPageParams {
  function getMulti(key: string): string[] | undefined {
    const vals = search.getAll(key)
    return vals.length ? vals : undefined
  }

  function getBool(key: string): boolean | undefined {
    const val = search.get(key)
    if (val === "true") return true
    if (val === "false") return false
    return undefined
  }

  return {
    q: search.get("q") || undefined,
    q_source: Q_SOURCES.includes(search.get("source") as QSource) ? (search.get("source") as QSource) : undefined,
    lieu_label: search.get("lieu_label") || undefined,
    mode: SEARCH_MODES.includes(search.get("mode") as SearchMode) ? (search.get("mode") as SearchMode) : DEFAULT_SEARCH_MODE,
    type_filter_label: getMulti("type_filter_label"),
    contract_type: getMulti("contract_type"),
    level: getMulti("level"),
    activity_sector: getMulti("activity_sector"),
    organization_name: search.get("organization_name") || undefined,
    start_date: search.get("start_date") || undefined,
    urgent: getBool("urgent"),
    handi: getBool("handi"),
    smart_apply: getBool("smart_apply"),
    is_algo_company: getBool("is_algo_company"),
    sort: SORT_OPTIONS.includes(search.get("sort") as SortOption) ? (search.get("sort") as SortOption) : undefined,
    latitude: search.get("latitude") ? parseFloat(search.get("latitude")!) : undefined,
    longitude: search.get("longitude") ? parseFloat(search.get("longitude")!) : undefined,
    radius: parseInt(search.get("radius") ?? "20", 10),
    page: parseInt(search.get("page") ?? "0", 10),
    hitsPerPage: parseInt(search.get("hitsPerPage") ?? "20", 10),
  }
}

export function buildSearchUrl(params: ISearchPageParams, basePath = "/beta/recherche"): string {
  const query = new URLSearchParams()

  if (params.q) query.set("q", params.q)
  if (params.q && params.q_source) query.set("source", params.q_source)
  if (params.lieu_label) query.set("lieu_label", params.lieu_label)
  if (params.mode !== DEFAULT_SEARCH_MODE) query.set("mode", params.mode)

  for (const val of params.type_filter_label ?? []) query.append("type_filter_label", val)
  for (const val of params.contract_type ?? []) query.append("contract_type", val)
  for (const val of params.level ?? []) query.append("level", val)
  for (const val of params.activity_sector ?? []) query.append("activity_sector", val)

  if (params.organization_name) query.set("organization_name", params.organization_name)
  if (params.start_date) query.set("start_date", params.start_date)
  if (params.urgent !== undefined) query.set("urgent", params.urgent.toString())
  if (params.handi !== undefined) query.set("handi", params.handi.toString())
  if (params.smart_apply !== undefined) query.set("smart_apply", params.smart_apply.toString())
  if (params.is_algo_company !== undefined) query.set("is_algo_company", params.is_algo_company.toString())
  if (params.sort) query.set("sort", params.sort)
  if (params.latitude !== undefined) query.set("latitude", params.latitude.toString())
  if (params.longitude !== undefined) query.set("longitude", params.longitude.toString())
  if (params.radius !== 20) query.set("radius", params.radius.toString())
  if (params.page !== 0) query.set("page", params.page.toString())
  if (params.hitsPerPage !== 20) query.set("hitsPerPage", params.hitsPerPage.toString())

  const qs = query.toString()
  return `${basePath}${qs ? `?${qs}` : ""}`
}

/**
 * Titre de la page de résultats, aligné sur le comportement du moteur legacy
 * (buildSearchTitle + PAGES.dynamic.recherche/rechercheFormation dans routes.utils.ts) :
 * contexte « - {métier} à {lieu} » ajouté seulement si un métier est saisi ; sans géo,
 * « sur la France entière » ; géo sans label de lieu → pas de mention de lieu.
 */
export function buildSearchPageTitle(params: ISearchPageParams): string {
  const base = params.mode === "formations" ? "Formations en alternance" : "Offres en alternance"
  let context = ""
  if (params.q) {
    context = ` - ${params.q}`
    if (params.lieu_label) {
      context += ` à ${params.lieu_label}`
    } else if (params.latitude === undefined) {
      context += " sur la France entière"
    }
  }
  return `${base}${context} | La bonne alternance`
}

export function buildHitDetailUrl(hit: { sub_type: string; url_id: string; title: string }, currentSearchUrl: string): string {
  const slug = toKebabCase(hit.title || "offre")
  const from = encodeURIComponent(currentSearchUrl)

  if (hit.sub_type === LBA_ITEM_TYPE.FORMATION) {
    return `/formation/${encodeURIComponent(hit.url_id)}/${slug}?from=${from}`
  }

  return `/emploi/${hit.sub_type}/${encodeURIComponent(hit.url_id)}/${slug}?from=${from}`
}
