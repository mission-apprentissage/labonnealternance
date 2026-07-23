import { describe, expect, it } from "vitest"

import { validatePersonName } from "./nameValidator.js"

describe("validatePersonName", () => {
  it.each(["Jean", "Jean-Paul", "D'Artagnan", "Le Moal", "Élodie", "A B", "É-lie", "François-Marie"])("should validate person names with at least two letters: %s", (name) => {
    expect(validatePersonName(name)).toBe(true)
  })

  it.each(["", " ", ".", "1", "A", "A1", "A!", "-", "A-", "É ", "O'", "A\nB", "A\tB"])("should reject names without two valid letters: %s", (name) => {
    expect(validatePersonName(name)).toBe(false)
  })
})
