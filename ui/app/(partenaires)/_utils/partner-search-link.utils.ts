import type { IPartnerSearchLinkPartner } from "shared/routes/_private/partner-search.routes"

import { buildSearchUrl, parseSearchPageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/search.params.utils"

// Liens partenaires `/<partenaire>/<code>` → `/recherche` (#5871) ; format et ajout d'un partenaire : docs/partenaires/liens-recherche-partenaires.md.
export const PARTNER_SEARCH_LINKS = {
  monmaster: { utm_source: "monmaster" },
} as const satisfies Record<IPartnerSearchLinkPartner, { utm_source: string }>

const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const
const MAX_UTM_LENGTH = 100

// Point décimal seul : parseFloat lirait `48,85` comme 48 et déplacerait la recherche d'une centaine de km.
const DECIMAL_COORDINATE_PATTERN = /^-?\d+(?:\.\d+)?$/

export type IPartnerGeo = { latitude: number; longitude: number }
export type IPartnerSearchResolution = { q?: string | null; lieu_label?: string | null }

/** Paire lat/lon exploitable, ou `null` (une seule coordonnée, valeur non décimale, hors bornes). */
export function readPartnerGeo(search: URLSearchParams): IPartnerGeo | null {
  const rawCoordinates = [search.get("latitude"), search.get("longitude")]
  if (!rawCoordinates.every((raw) => raw !== null && DECIMAL_COORDINATE_PATTERN.test(raw.trim()))) return null
  const { latitude, longitude } = parseSearchPageParams(search)
  if (latitude === undefined || longitude === undefined) return null
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null
  return { latitude, longitude }
}

/**
 * URL `/recherche` de destination, relative au site. Seuls les paramètres listés ici sont repris
 * du lien partenaire : tout le reste est ignoré, et la destination est toujours `/recherche`.
 */
export function buildPartnerSearchUrl(partner: IPartnerSearchLinkPartner, search: URLSearchParams, resolution: IPartnerSearchResolution | null): string {
  const geo = readPartnerGeo(search)
  const searchUrl = buildSearchUrl({
    ...parseSearchPageParams(new URLSearchParams()),
    q: resolution?.q ?? undefined,
    lieu_label: geo ? (resolution?.lieu_label ?? undefined) : undefined,
    latitude: geo?.latitude,
    longitude: geo?.longitude,
  })

  const target = new URL(searchUrl, "http://localhost")
  // Posé même sans `q` (buildSearchUrl ne l'émet qu'avec) : un repli géo seule reste attribué au
  // partenaire et exclu des stats de recherche organique (cf. analyze-search-queries).
  target.searchParams.set("search_source", "partner_links")
  for (const key of UTM_PARAMS) {
    const value = search.get(key)?.trim()
    if (value && value.length <= MAX_UTM_LENGTH) target.searchParams.set(key, value)
  }
  if (!target.searchParams.has("utm_source")) target.searchParams.set("utm_source", PARTNER_SEARCH_LINKS[partner].utm_source)

  return `${target.pathname}${target.search}`
}

export const PARTNER_REDIRECT_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex",
} as const
