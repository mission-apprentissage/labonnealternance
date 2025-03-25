import { describe, expect, it } from "vitest"

import { validateSIRET } from "./siretValidator.js"

describe("validateSIRET", () => {
  it.each([["73282932000074", "35600000000048"]])("should validate correct luhn numbers", (siret) => {
    expect(validateSIRET(siret)).toBe(true)
  })
  it.each([["35600000009075", "35600000009093"]])("should validate LaPoste special SIRET numbers", (siret) => {
    expect(validateSIRET(siret)).toBe(true)
  })
  it.each([["50000000000000"]])("should fail with SIRET not following luhn other than LaPoste", (siret) => {
    expect(validateSIRET(siret)).toBe(false)
  })
  it.each([["35600000009090"]])("should fail with SIREN LaPoste not following own algo", (siret) => {
    expect(validateSIRET(siret)).toBe(false)
  })
})
