import { IDeleteRoutes, IGetRoutes, IPatchRoutes, IPostRoutes, IPutRoutes, IRequest, IRequestFetchOptions, IResponse } from "shared"
import { PathParam, QueryString, WithQueryStringAndPathParam, generateUri } from "shared/helpers/generateUri"
import { IResErrorJson, IRouteSchema, IRouteSchemaWrite } from "shared/routes/common.routes"
import type { EmptyObject } from "type-fest"
import z, { ZodType } from "zod"

import { publicConfig } from "../config.public"

type OptionsGet = {
  [Prop in keyof Pick<IRouteSchema, "params" | "querystring" | "headers">]: IRouteSchema[Prop] extends ZodType ? z.input<IRouteSchema[Prop]> : never
}

type OptionsWrite = {
  [Prop in keyof Pick<IRouteSchemaWrite, "params" | "querystring" | "headers" | "body">]: IRouteSchemaWrite[Prop] extends ZodType ? z.input<IRouteSchemaWrite[Prop]> : never
}

type IRequestOptions = OptionsGet | OptionsWrite | EmptyObject

async function optionsToFetchParams(method: RequestInit["method"], options: IRequestOptions, fetchOptions: IRequestFetchOptions) {
  const { timeout, headers: addedHeaders } = fetchOptions

  const headers = await getHeaders(options)

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
      headers.append(name, h[name])
    })
  }

  try {
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
  } catch (error) {
    // We're in client, cookies will be includes
  }

  return headers
}

const removeAtEnd = (url: string, removed: string): string => (url.endsWith(removed) ? url.slice(0, -removed.length) : url)

export function generateUrl(path: string, options: WithQueryStringAndPathParam = {}): string {
  const params = "params" in options ? options.params : {}
  const querystring = "querystring" in options ? options.querystring : {}
  const baseUrl = publicConfig.apiEndpoint
  return removeAtEnd(baseUrl, "/") + generateUri(path, { params, querystring })
}

export interface ApiErrorContext {
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
      } catch (error) {
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
  const { requestInit, headers } = await optionsToFetchParams("POST", options, fetchOptions)
  const res = await fetch(generateUrl(path, options), requestInit)
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
  const { requestInit, headers } = await optionsToFetchParams("GET", options, fetchOptions)
  const res = await fetch(generateUrl(path, options), requestInit)
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
  const { requestInit, headers } = await optionsToFetchParams("PUT", options, fetchOptions)
  const res = await fetch(generateUrl(path, options), requestInit)
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
  const { requestInit, headers } = await optionsToFetchParams("PATCH", options, fetchOptions)
  const res = await fetch(generateUrl(path, options), requestInit)
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
  const { requestInit, headers } = await optionsToFetchParams("DELETE", options, fetchOptions)
  const res = await fetch(generateUrl(path, options), requestInit)
  if (!res.ok) {
    throw await ApiError.build(path, headers, options, res)
  }
  return res.json()
}
