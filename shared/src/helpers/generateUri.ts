import type { EmptyObject } from "type-fest"

export type PathParam = Record<string, string>
export type QueryString = Record<string, string | string[]>
export type WithQueryStringAndPathParam =
  | {
      params?: PathParam
      querystring?: QueryString
    }
  | EmptyObject

/*
 * The following function is inspired from https://github.com/remix-run/react-router/blob/868e5157bbb72fb77f827f264a2b7f6f6106147d/packages/router/utils.ts#L751-L802
 *
 * MIT License
 *
 * Copyright (c) React Training LLC 2015-2019
 * Copyright (c) Remix Software Inc. 2020-2021
 * Copyright (c) Shopify Inc. 2022-2023
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
export function generatePath(originalPath: string, params: PathParam = {}): string {
  let path: string = originalPath
  if (path.endsWith("*") && path !== "*" && !path.endsWith("/*")) {
    path = path.replace(/\*$/, "/*")
  }
  const prefix = path.startsWith("/") ? "/" : ""

  const stringify = (p: unknown) => (p == null ? "" : typeof p === "string" ? p : String(p))

  const segments = path
    .split(/\/+/)
    .map((segment, index, array) => {
      const isLastSegment = index === array.length - 1

      // only apply the splat if it's the last segment
      if (isLastSegment && segment === "*") {
        const star = "*"
        // Apply the splat
        return stringify(params[star])
      }

      const keyMatch = segment.match(/^:(\w+)(\??)$/)
      if (keyMatch) {
        const [, key, optional] = keyMatch
        const param = params[key]
        if (optional !== "?" && param == null) {
          throw new Error(`Missing ":${key}" param`)
        }

        return stringify(encodeURIComponent(param))
      }

      // Remove any optional markers from optional static segments
      return segment.replace(/\?$/g, "")
    })
    // Remove empty segments
    .filter((segment) => !!segment)

  return prefix + segments.join("/")
}

export function generateQueryString(query: QueryString = {}): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(key, v))
    } else {
      searchParams.append(key, value)
    }
  }
  const searchString = searchParams.toString()
  return searchString ? `?${searchString}` : ""
}

export function generateUri(path: string, options: WithQueryStringAndPathParam = {}): string {
  const params = "params" in options ? options.params : {}
  const querystring = "querystring" in options ? options.querystring : {}
  return generatePath(path, params) + generateQueryString(querystring)
}
