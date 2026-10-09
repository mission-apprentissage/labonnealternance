import type { NextResponse } from "next/server"
import { normalizeOpcoUrl, OPCO_FILTER_PARAM, OPCO_URL_FILTER_PARAM, parseOpcoFilter } from "shared/utils/opco-search-filter"

export const OPCO_FILTER_COOKIE_NAME = "lba_opco"
export const OPCO_URL_FILTER_COOKIE_NAME = "lba_opco_url"

// Cookie de session (sans Max-Age) : le filtre vaut jusqu'à la fermeture du navigateur.
// SameSite=None et Partitioned : `/recherche` est embarquée en iframe par les sites partenaires,
// contexte tiers où un cookie Lax n'est ni posé ni envoyé. Pas httpOnly : c'est le navigateur
// qui ajoute le filtre aux appels à `/v1/search` (cf. readOpcoFilterQuerystring).
export const OPCO_FILTER_COOKIE_OPTIONS = { path: "/", sameSite: "none", secure: true, partitioned: true, httpOnly: false } as const

const OPCO_FILTERS = [
  { param: OPCO_FILTER_PARAM, cookie: OPCO_FILTER_COOKIE_NAME, parse: parseOpcoFilter },
  { param: OPCO_URL_FILTER_PARAM, cookie: OPCO_URL_FILTER_COOKIE_NAME, parse: normalizeOpcoUrl },
] as const

/**
 * Reporte `opco` / `opcoUrl` de l'URL dans le cookie de session, sur n'importe quelle page
 * d'arrivée. Un paramètre vide retire le filtre ; une valeur invalide le laisse en place.
 */
export function applyOpcoFilterFromUrl(searchParams: URLSearchParams, cookies: NextResponse["cookies"]): void {
  for (const { param, cookie, parse } of OPCO_FILTERS) {
    if (!searchParams.has(param)) continue
    const raw = searchParams.get(param)
    if (!raw?.trim()) {
      cookies.set(cookie, "", { ...OPCO_FILTER_COOKIE_OPTIONS, maxAge: 0 })
      continue
    }
    const value = parse(raw)
    if (value) cookies.set(cookie, value, OPCO_FILTER_COOKIE_OPTIONS)
  }
}

/** Paramètres `opco` / `opcoUrl` de `/v1/search` d'après les cookies (`document.cookie`) ; revalidés, un cookie altéré provoquerait un 400. */
export function readOpcoFilterQuerystring(cookieString: string): { opco?: string; opcoUrl?: string } {
  const cookies = new Map(
    cookieString.split(";").map((part) => {
      const [name, ...value] = part.trim().split("=")
      // Pas de décodage : clé d'OPCO et nom de domaine n'ont aucun caractère à encoder.
      return [name, value.join("=")] as const
    })
  )
  const result: { opco?: string; opcoUrl?: string } = {}
  for (const { param, cookie, parse } of OPCO_FILTERS) {
    const value = parse(cookies.get(cookie))
    if (value) result[param] = value
  }
  return result
}
