import fastify, { RouteOptions } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod"
import { zRoutes } from "shared/index"
import { describe, it, expect } from "vitest"

import { bind } from "@/http/server"

describe("server", () => {
  it("should respect zRoutes", async () => {
    const app = fastify().withTypeProvider<ZodTypeProvider>()
    const routes: Array<RouteOptions & { routePath: string; path: string; prefix: string }> = []
    app.addHook("onRoute", (r) => {
      routes.push(r as RouteOptions & { routePath: string; path: string; prefix: string })
    })
    await bind(app)

    for (const route of routes) {
      const { path, schema } = route
      if (!path.startsWith("/api/V1/application")) {
        continue
      }
      const methods = Array.isArray(route.method) ? route.method : [route.method]
      for (const method of methods) {
        expect
          .soft({
            method,
            path,
            routeHasSchema: !!schema,
            sharedSchemaExists: !!zRoutes[method.toLowerCase()][path],
          })
          .toEqual({
            method,
            path,
            routeHasSchema: true,
            sharedSchemaExists: true,
          })
        expect({
          method,
          path,
          schema,
        }).toEqual({ method, path, schema: zRoutes[method.toLowerCase()][path] })
      }
    }

    // console.log(server.printRoutes())
  })
})
