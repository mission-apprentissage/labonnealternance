import { describe, expect, it } from "vitest"

import { generatePath } from "./generateUri.js"

describe("Generate path", () => {
  it("Should generate path without variable", () => {
    expect(generatePath("/path")).toBe("/path")
  })
  it("Should generate path with a single variable", () => {
    expect(generatePath("/path/:variable", { variable: "value" })).toBe("/path/value")
  })
  it("Should generate path with a single variable with special chars", () => {
    expect(generatePath("/path/:variable", { variable: "1234567/|^" })).toBe("/path/1234567%2F%7C%5E")
  })
  it("Should generate path with a multiple variables", () => {
    expect(generatePath("/path/:var1/:var2", { var1: "1234567/|^", var2: "6(3254643Dftrdss" })).toBe("/path/1234567%2F%7C%5E/6(3254643Dftrdss")
  })
})
