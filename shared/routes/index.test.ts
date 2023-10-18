import assert from "node:assert"

import { describe, it } from "vitest"

import { IRouteSchema, ZResError } from "./common.routes"

import { zRoutes } from "."

describe("zRoutes", () => {
  it("should define error schema compatible with default one from error middleware", () => {
    for (const [method, zMethodRoutes] of Object.entries(zRoutes)) {
      for (const [path, def] of Object.entries(zMethodRoutes)) {
        for (const [statusCode, response] of Object.entries((def as IRouteSchema).response)) {
          if (`${statusCode}`.startsWith("4") || `${statusCode}`.startsWith("5")) {
            if (response === ZResError) {
              continue
            }
            // @ts-expect-error
            assert.equal(response._def.typeName, "ZodUnion", `${method} ${path}: doesn't satisfies ZResError`)
            // @ts-expect-error
            assert.equal(response._def.options.includes(ZResError), true, `${method} ${path}: doesn't satisfies ZResError`)
          }
        }
      }
    }
  })

  it("should method & path be defined correctly", () => {
    for (const [method, zMethodRoutes] of Object.entries(zRoutes)) {
      for (const [path, def] of Object.entries(zMethodRoutes)) {
        assert.equal(def.method, method, `${method} ${path}: have invalid method`)
        assert.equal(def.path, path, `${method} ${path}: have invalid path`)
      }
    }
  })
})
