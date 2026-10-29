import type { NextResponse } from "next/server"
import type { IOpcoFilterKey } from "shared/utils/opco-search-filter"
import { OPCO_FILTER_PARAM, parseOpcoFilter } from "shared/utils/opco-search-filter"

export const OPCO_FILTER_COOKIE_NAME = "lba_opco"

// Cookie de session (sans Max-Age) : le filtre vaut jusqu'à la fermeture du navigateur.
// SameSite=None et Partitioned : `/recherche` est embarquée en iframe par les sites partenaires,
// contexte tiers où un cookie Lax n'est ni posé ni envoyé. Pas httpOnly : c'est le navigateur
// qui ajoute le filtre aux appels à `/v1/search` (cf. useSearchResults).
export const OPCO_FILTER_COOKIE_OPTIONS = { path: "/", sameSite: "none", secure: true, partitioned: true, httpOnly: false } as const

/**
 * Reporte `opco` de l'URL dans le cookie de session, sur n'importe quelle page d'arrivée. Un
 * paramètre vide retire le filtre ; une valeur invalide le laisse en place.
 */
export function applyOpcoFilterFromUrl(searchParams: URLSearchParams, cookies: NextResponse["cookies"]): void {
  if (!searchParams.has(OPCO_FILTER_PARAM)) return
  const raw = searchParams.get(OPCO_FILTER_PARAM)
  if (!raw?.trim()) {
    // `expires` et non `maxAge: 0` : Next réémet un second Set-Cookie sans Max-Age, qui recrée un cookie vide.
    cookies.set(OPCO_FILTER_COOKIE_NAME, "", { ...OPCO_FILTER_COOKIE_OPTIONS, expires: new Date(0) })
    return
  }
  const opco = parseOpcoFilter(raw)
  if (opco) cookies.set(OPCO_FILTER_COOKIE_NAME, opco, OPCO_FILTER_COOKIE_OPTIONS)
}

/** Clé d'OPCO du cookie de session (`document.cookie`) ; revalidée, un cookie altéré provoquerait un 400. */
export function readOpcoFilterCookie(cookieString: string): IOpcoFilterKey | undefined {
  const cookie = cookieString
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${OPCO_FILTER_COOKIE_NAME}=`))
  return parseOpcoFilter(cookie?.slice(OPCO_FILTER_COOKIE_NAME.length + 1)) ?? undefined
}
