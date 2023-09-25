import assert from "assert"

import fastify, { RouteOptions } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod"
import { zRoutes } from "shared/index"
import { describe, it } from "vitest"

import { bind } from "@/http/server"

describe("server", () => {
  it("should follow shared schema definition", async () => {
    const app = fastify().withTypeProvider<ZodTypeProvider>()
    const routes: Array<RouteOptions & { routePath: string; path: string; prefix: string }> = []
    app.addHook("onRoute", (r) => {
      routes.push(r as RouteOptions & { routePath: string; path: string; prefix: string })
    })
    await bind(app)

    const seen = new Set()

    for (const route of routes) {
      const { path, schema } = route

      // Swagger is not following schema
      if (path.startsWith("/api/docs")) {
        continue
      }

      // Known path aliases
      const normalizedPath = path.startsWith("/api/romelabels") ? path.replace("/api/romelabels", "/api/rome") : path

      const methods = Array.isArray(route.method) ? route.method : [route.method]
      for (const method of methods) {
        // HEAD are not part of schema
        if (method === "HEAD" || method === "OPTIONS") {
          continue
        }

        assert.equal(!!schema, true, `${method} ${path}: schema not define in route`)
        const sharedSchema = zRoutes?.[method.toLowerCase()]?.[normalizedPath]
        assert.equal(!!sharedSchema, true, `${method} ${path}: schema not define in shared`)
        assert.equal(schema, sharedSchema, `${method} ${path}: schema not match shared schema`)

        seen.add(`${method} ${path}`)
      }
    }

    for (const [method, zMethodRoutes] of Object.entries(zRoutes)) {
      for (const path of Object.keys(zMethodRoutes)) {
        if (seen.has(`${method} ${path}`)) {
          assert.fail(`${method} ${path}: schema in shared not used in routes`)
        }
      }
    }
  })
})
