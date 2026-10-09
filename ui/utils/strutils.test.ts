import { describe, expect, it } from "vitest"
import { pluralize } from "./strutils"

describe("pluralize", () => {
  it.each([
    [0, "0 résultat"],
    [1, "1 résultat"],
    [2, "2 résultats"],
  ])("%i → %s", (count, expected) => {
    expect(pluralize(count, "résultat")).toBe(expected)
  })

  it("utilise le pluriel fourni, accord compris", () => {
    expect(pluralize(1, "lieu proposé", "lieux proposés")).toBe("1 lieu proposé")
    expect(pluralize(4, "lieu proposé", "lieux proposés")).toBe("4 lieux proposés")
  })
})
