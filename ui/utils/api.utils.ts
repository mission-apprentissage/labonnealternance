import type { IDeleteRoutes, IGetRoutes, IPatchRoutes, IPostRoutes, IPutRoutes, IRequest, IRequestFetchOptions, IResponse } from "shared"
import { SEARCH_CHANNEL_HEADER, SEARCH_TOKEN_EXHAUSTED, SEARCH_TOKEN_HEADER, SEARCH_TOKEN_REQUIRED } from "shared/constants/search-token"
import type { PathParam, QueryString, WithQueryStringAndPathParam } from "shared/helpers/generate-uri"
import { generateUri } from "shared/helpers/generate-uri"
import type { IResErrorJson, IRouteSchema, IRouteSchemaWrite } from "shared/routes/common.routes"
import type { EmptyObject } from "type-fest"
import type z from "zod"
import type { core } from "zod"

import { publicConfig } from "@/config.public"
import { BFF_PREFIX, isBffPath, isSearchTokenPath } from "@/utils/bff-routes"
import { getSearchToken } from "@/utils/search-token.store"
import { getServerApiEndpoint } from "@/utils/server-api-endpoint"

type OptionsGet = {
  [Prop in keyof Pick<IRouteSchema, "params" | "querystring" | "headers">]: IRouteSchema[Prop] extends core.$ZodType ? z.input<IRouteSchema[Prop]> : never
}

type OptionsWrite = {
  [Prop in keyof Pick<IRouteSchemaWrite, "params" | "querystring" | "headers" | "body">]: IRouteSchemaWrite[Prop] extends core.$ZodType ? z.input<IRouteSchemaWrite[Prop]> : never
}

type IRequestOptions = OptionsGet | OptionsWrite | EmptyObject

async function optionsToFetchParams(method: RequestInit["method"], options: IRequestOptions, fetchOptions: IRequestFetchOptions, path: string) {
  const { timeout, headers: addedHeaders, keepalive } = fetchOptions

  const headers = await getHeaders(options)
  if (global.window && isSearchTokenPath(path)) {
    // Canal des statistiques de recherche : page affichée dans une iframe tierce (widget) ou non.
    headers.set(SEARCH_CHANNEL_HEADER, window.self === window.top ? "site" : "widget")
  }

  if (addedHeaders) {
    Object.entries(addedHeaders).forEach(([key, value]) => {
      headers.append(key, value)
    })
  }

  let body: BodyInit | undefined = undefined
  if ("body" in options && method !== "GET") {
    if (options.body instanceof FormData) {
      body = options.body
    } else {
      body = JSON.stringify(options.body)
      headers.append("Content-Type", "application/json")
    }
  }

  const requestInit: RequestInit = {
    mode: publicConfig.env === "local" ? "cors" : "same-origin",
    credentials: publicConfig.env === "local" ? "include" : "same-origin",
    signal: timeout ? AbortSignal.timeout(timeout) : undefined,
    keepalive,
    body,
    method,
    headers,
  }
  return { requestInit, headers }
}

async function getHeaders(options: IRequestOptions) {
  const headers = new Headers()

  if ("headers" in options) {
    const h = options.headers
    Object.keys(h).forEach((name) => {
      headers.append(name, h[name] as string)
    })
  }

  if (!global.window) {
    // By default server-side we don't use headers
    // But we need them for the api, as all routes are authenticated
    const { headers: nextHeaders } = await import("next/headers")
    const h = await nextHeaders()
    const cookie = h.get("cookie")
    if (cookie) {
      headers.append("cookie", cookie)
    }
  }

  return headers
}

const removeAtEnd = (url: string, removed: string): string => (url.endsWith(removed) ? url.slice(0, -removed.length) : url)

// Le serveur Next appelle l'API en direct ; le navigateur passe par le BFF pour les routes fermées à
// Internet (cf. bff-routes.ts).
function apiBaseUrl(path: string): string {
  if (!global.window) return getServerApiEndpoint()
  if (isBffPath(path)) return BFF_PREFIX
  return removeAtEnd(publicConfig.apiEndpoint, "/")
}

export function generateUrl(path: string, options: WithQueryStringAndPathParam = {}): string {
  const params = "params" in options ? options.params : {}
  const querystring = "querystring" in options ? options.querystring : {}
  return apiBaseUrl(path) + generateUri(path, { params, querystring })
}

const SEARCH_TOKEN_REFUSALS: string[] = [SEARCH_TOKEN_REQUIRED, SEARCH_TOKEN_EXHAUSTED]

/**
 * Sur un refus de jeton de recherche, obtient un nouveau jeton (preuve de travail, cf. search-token.client)
 * puis rejoue la requête une fois. Le module de preuve de travail n'est chargé qu'à ce moment-là.
 */
// Jeton en mémoire relu à chaque envoi : le rejeu qui suit un renouvellement porte le nouveau.
function fetchWithSearchToken(path: string, url: string, requestInit: RequestInit): Promise<Response> {
  const token = global.window && isSearchTokenPath(path) ? getSearchToken() : null
  if (!token) return fetch(url, requestInit)
  const headers = new Headers(requestInit.headers)
  headers.set(SEARCH_TOKEN_HEADER, token)
  return fetch(url, { ...requestInit, headers })
}

async function fetchApi(path: string, url: string, requestInit: RequestInit): Promise<Response> {
  const startedAt = performance.now()
  const res = await fetchWithSearchToken(path, url, requestInit)
  if (res.status !== 401 || !global.window || !isSearchTokenPath(path)) return res

  const message = await res
    .clone()
    .json()
    .then((body: { message?: unknown }) => body?.message)
    .catch(() => null)
  if (typeof message !== "string" || !SEARCH_TOKEN_REFUSALS.includes(message)) return res

  const { renewSearchToken } = await import("@/utils/search-token.client")
  try {
    await renewSearchToken(startedAt)
  } catch (error) {
    // Échec de la preuve de travail : signalé à Sentry, l'appelant reçoit l'ApiError du 401 d'origine.
    const { captureException } = await import("@sentry/nextjs")
    captureException(error)
    return res
  }
  return fetchWithSearchToken(path, url, requestInit)
}

interface ApiErrorContext {
  path: string
  params: PathParam
  querystring: QueryString
  requestHeaders: Record<string, string | string[]>
  statusCode: number
  message: string
  name: string
  responseHeaders: Record<string, string | string[]>
  errorData: any
}

export class ApiError extends Error {
  context: ApiErrorContext

  constructor(context: ApiErrorContext) {
    super()
    this.context = context
    this.name = context.name
    this.message = context.message
  }

  toJSON(): ApiErrorContext {
    return this.context
  }

  isNotFoundError(): boolean {
    return this.context.statusCode === 404
  }

  static async build(path: string, requestHeaders: Headers, options: WithQueryStringAndPathParam, res: Response): Promise<ApiError> {
    let message = res.status === 0 ? "Network Error" : res.statusText
    let name = "Api Error"
    let errorData: IResErrorJson["data"] | null = null

    if (res.status > 0) {
      try {
        if (res.headers.get("Content-Type")?.startsWith("application/json")) {
          const data: IResErrorJson = await res.json()
          name = data.error
          message = data.message
          errorData = data.data
        }
      } catch (_) {
        // ignore
      }
    }

    return new ApiError({
      path,
      params: "params" in options ? options.params : {},
      querystring: "querystring" in options ? options.querystring : {},
      requestHeaders: Object.fromEntries(requestHeaders.entries()),
      statusCode: res.status,
      message,
      name,
      responseHeaders: Object.fromEntries(res.headers.entries()),
      errorData,
    })
  }
}

export async function apiPost<P extends keyof IPostRoutes, S extends IPostRoutes[P] = IPostRoutes[P]>(
  path: P,
  options: IRequest<S>,
  fetchOptions: IRequestFetchOptions = {}
): Promise<IResponse<S>> {
  const { requestInit, headers } = await optionsToFetchParams("POST", options, fetchOptions, path)
  const res = await fetchApi(path, generateUrl(path, options), requestInit)
  if (!res.ok) {
    throw await ApiError.build(path, headers, options, res)
  }
  return res.json()
}

export async function apiGet<P extends keyof IGetRoutes, S extends IGetRoutes[P] = IGetRoutes[P]>(
  path: P,
  options: IRequest<S>,
  fetchOptions: IRequestFetchOptions = {}
): Promise<IResponse<S>> {
  const { requestInit, headers } = await optionsToFetchParams("GET", options, fetchOptions, path)
  const res = await fetchApi(path, generateUrl(path, options), requestInit)
  if (!res.ok) {
    throw await ApiError.build(path, headers, options, res)
  }
  return res.json()
}

export async function apiPut<P extends keyof IPutRoutes, S extends IPutRoutes[P] = IPutRoutes[P]>(
  path: P,
  options: IRequest<S>,
  fetchOptions: IRequestFetchOptions = {}
): Promise<IResponse<S>> {
  const { requestInit, headers } = await optionsToFetchParams("PUT", options, fetchOptions, path)
  const res = await fetchApi(path, generateUrl(path, options), requestInit)
  if (!res.ok) {
    throw await ApiError.build(path, headers, options, res)
  }
  return res.json()
}

export async function apiPatch<P extends keyof IPatchRoutes, S extends IPatchRoutes[P] = IPatchRoutes[P]>(
  path: P,
  options: IRequest<S>,
  fetchOptions: IRequestFetchOptions = {}
): Promise<IResponse<S>> {
  const { requestInit, headers } = await optionsToFetchParams("PATCH", options, fetchOptions, path)
  const res = await fetchApi(path, generateUrl(path, options), requestInit)
  if (!res.ok) {
    throw await ApiError.build(path, headers, options, res)
  }
  return res.json()
}

export async function apiDelete<P extends keyof IDeleteRoutes, S extends IDeleteRoutes[P] = IDeleteRoutes[P]>(
  path: P,
  options: IRequest<S>,
  fetchOptions: IRequestFetchOptions = {}
): Promise<IResponse<S>> {
  const { requestInit, headers } = await optionsToFetchParams("DELETE", options, fetchOptions, path)
  const res = await fetchApi(path, generateUrl(path, options), requestInit)
  if (!res.ok) {
    throw await ApiError.build(path, headers, options, res)
  }
  return res.json()
}
