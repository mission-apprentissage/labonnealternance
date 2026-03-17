import { toKebabCase } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

export interface ISearchPageParams {
  q?: string
  type_filter_label?: string[] // filtre par libellé de type (ex: "Offre d'emploi en alternance")
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

  return {
    q: search.get("q") || undefined,
    type_filter_label: getMulti("type_filter_label"),
    contract_type: getMulti("contract_type"),
    level: getMulti("level"),
    activity_sector: getMulti("activity_sector"),
    organization_name: search.get("organization_name") || undefined,
    latitude: search.get("latitude") ? parseFloat(search.get("latitude")!) : undefined,
    longitude: search.get("longitude") ? parseFloat(search.get("longitude")!) : undefined,
    radius: parseInt(search.get("radius") ?? "30", 10),
    page: parseInt(search.get("page") ?? "0", 10),
    hitsPerPage: parseInt(search.get("hitsPerPage") ?? "20", 10),
  }
}

export function buildSearchUrl(params: ISearchPageParams): string {
  const query = new URLSearchParams()

  if (params.q) query.set("q", params.q)

  for (const val of params.type_filter_label ?? []) query.append("type_filter_label", val)
  for (const val of params.contract_type ?? []) query.append("contract_type", val)
  for (const val of params.level ?? []) query.append("level", val)
  for (const val of params.activity_sector ?? []) query.append("activity_sector", val)

  if (params.organization_name) query.set("organization_name", params.organization_name)
  if (params.latitude !== undefined) query.set("latitude", params.latitude.toString())
  if (params.longitude !== undefined) query.set("longitude", params.longitude.toString())
  if (params.radius !== 30) query.set("radius", params.radius.toString())
  if (params.page !== 0) query.set("page", params.page.toString())
  if (params.hitsPerPage !== 20) query.set("hitsPerPage", params.hitsPerPage.toString())

  const qs = query.toString()
  return `/search${qs ? `?${qs}` : ""}`
}

export function buildHitDetailUrl(hit: { sub_type: string; url_id: string; title: string }, currentSearchUrl: string): string {
  const slug = toKebabCase(hit.title || "offre")
  const from = encodeURIComponent(currentSearchUrl)

  if (hit.sub_type === LBA_ITEM_TYPE.FORMATION) {
    return `/formation/${encodeURIComponent(hit.url_id)}/${slug}?from=${from}`
  }

  return `/emploi/${hit.sub_type}/${encodeURIComponent(hit.url_id)}/${slug}?from=${from}`
}
