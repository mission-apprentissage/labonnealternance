import assert from "assert"

import fastify, { RouteOptions } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod"
import { zRoutes } from "shared/index"
import { SecurityScheme } from "shared/routes/common.routes"
import { describe, it } from "vitest"

import { describeAuthMiddleware } from "@/http/middlewares/authMiddleware"
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
      const { routePath, schema, prefix, onRequest = [], preHandler = [] } = route

      if (prefix !== "/api") {
        continue
      }

      const methods = Array.isArray(route.method) ? route.method : [route.method]
      for (const method of methods) {
        // HEAD are not part of schema
        if (method === "HEAD" || method === "OPTIONS") {
          continue
        }

        assert.equal(!!schema, true, `${method} ${routePath}: schema not define in route`)
        const sharedSchema = zRoutes?.[method.toLowerCase()]?.[routePath]
        assert.equal(!!sharedSchema, true, `${method} ${routePath}: schema not define in shared`)
        assert.equal(schema, sharedSchema, `${method} ${routePath}: schema not match shared schema`)

        const onRequestAuth = (Array.isArray(onRequest) ? onRequest : [onRequest]).reduce((acc, fn) => {
          const s = describeAuthMiddleware(fn)
          if (s) {
            acc.push(s)
          }
          return acc
        }, [] as SecurityScheme[])
        const preHandlerAuth = (Array.isArray(preHandler) ? preHandler : [preHandler]).reduce((acc, fn) => {
          const s = describeAuthMiddleware(fn)
          if (s) {
            acc.push(s)
          }
          return acc
        }, [] as SecurityScheme[])

        const expectedAuth: { onRequestAuth: SecurityScheme[]; preHandlerAuth: SecurityScheme[] } = { onRequestAuth: [], preHandlerAuth: [] }
        if (sharedSchema.securityScheme) {
          expectedAuth.onRequestAuth.push(sharedSchema.securityScheme)
        }

        assert.deepEqual({ onRequestAuth, preHandlerAuth }, expectedAuth, `${method} ${routePath}: security not match shared schema`)

        seen.add(`${method} ${routePath}`)
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
