import "server-only"

import type { NextRequest } from "next/server"
import { SEARCH_CHANNEL_HEADER, SEARCH_CHANNELS, SEARCH_TOKEN_COOKIE_NAME, SEARCH_TOKEN_HEADER, SEARCH_TOKEN_REQUIRED } from "shared/constants/search-token"

import { isBffPath, isSearchTokenPath } from "@/utils/bff-routes"
import { getServerApiEndpoint } from "@/utils/server-api-endpoint"

const UPSTREAM_TIMEOUT_MS = 30_000

const FORWARDED_REQUEST_HEADERS = ["accept", "accept-language", "authorization", "content-type", "cookie", "referer", "user-agent"]
// fetch décompresse le corps : l'encodage et la longueur d'origine ne s'appliquent plus.
const DROPPED_RESPONSE_HEADERS = ["connection", "content-encoding", "content-length", "keep-alive", "transfer-encoding"]

const jsonError = (statusCode: number, error: string, message: string) =>
  Response.json({ statusCode, error, message }, { status: statusCode, headers: { "cache-control": "no-store" } })

/**
 * En-têtes transmis à l'API. L'IP de l'internaute vient de X-Real-IP, que nginx réécrit à chaque requête
 * (includes/proxy.conf de l'image du reverse proxy) ; le X-Forwarded-For reçu, falsifiable, n'est pas
 * relayé. L'API la lit en X-Forwarded-For (trustProxy: 1).
 */
export function buildUpstreamHeaders(request: Request, apiPath: string, searchToken: string | undefined): Headers {
  const headers = new Headers()
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }
  const clientIp = request.headers.get("x-real-ip")
  if (clientIp) headers.set("x-forwarded-for", clientIp)

  if (isSearchTokenPath(apiPath)) {
    const channel = request.headers.get(SEARCH_CHANNEL_HEADER)
    headers.set(SEARCH_CHANNEL_HEADER, channel && (SEARCH_CHANNELS as readonly string[]).includes(channel) ? channel : "site")
    if (searchToken) headers.set(SEARCH_TOKEN_HEADER, searchToken)
  }
  return headers
}

/** Querystring relayé ; `internal` est réservé au rendu serveur et n'est jamais accepté du navigateur. */
export function buildUpstreamSearch(url: URL): string {
  const params = new URLSearchParams(url.search)
  params.delete("internal")
  const search = params.toString()
  return search ? `?${search}` : ""
}

// Les segments arrivent décodés : `%2e%2e` devient `..`, que fetch résoudrait hors du préfixe autorisé.
const isUnsafeSegment = (segment: string) => segment === "" || segment === "." || segment === ".."

export function toApiPath(segments: string[]): string | null {
  if (segments.some(isUnsafeSegment)) return null
  const apiPath = `/${segments.map(encodeURIComponent).join("/")}`
  return isBffPath(apiPath) ? apiPath : null
}

export async function forwardToApi(request: NextRequest, segments: string[]): Promise<Response> {
  const apiPath = toApiPath(segments)
  if (!apiPath) {
    return jsonError(404, "Not Found", "Route inconnue")
  }

  const searchToken = request.cookies.get(SEARCH_TOKEN_COOKIE_NAME)?.value
  // Sans jeton, l'API répondrait la même chose : le client relance une preuve de travail sans aller-retour.
  if (isSearchTokenPath(apiPath) && !searchToken) {
    return jsonError(401, "Unauthorized", SEARCH_TOKEN_REQUIRED)
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD"
  let upstream: Response
  try {
    upstream = await fetch(`${getServerApiEndpoint()}${apiPath}${buildUpstreamSearch(request.nextUrl)}`, {
      method: request.method,
      headers: buildUpstreamHeaders(request, apiPath, searchToken),
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)]),
    })
  } catch (error) {
    if (request.signal.aborted) {
      return new Response(null, { status: 499 })
    }
    const timedOut = error instanceof DOMException && error.name === "TimeoutError"
    return jsonError(timedOut ? 504 : 502, timedOut ? "Gateway Timeout" : "Bad Gateway", "API indisponible")
  }

  const headers = new Headers(upstream.headers)
  for (const name of DROPPED_RESPONSE_HEADERS) headers.delete(name)
  if (!headers.has("cache-control")) headers.set("cache-control", "no-store")
  return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers })
}
