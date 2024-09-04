import type { CountryCode } from "libphonenumber-js"
import { getExampleNumber } from "libphonenumber-js"
import examples from "libphonenumber-js/mobile/examples"
import { describe, expect, it } from "vitest"

import { paysUE, validatePhone } from "./phoneValidator"

const phoneExample = paysUE
  .map((pays) => {
    const phoneUtil = getExampleNumber(pays.code as CountryCode, examples)
    if (!phoneUtil) return null
    return phoneUtil.formatInternational()
  })
  .filter((x) => x !== null) as string[]

describe("validatePhone", () => {
  it("should success converting a french number and validate it", () => expect(validatePhone("0132568790")).toBe(true))
  it("should throw error as it's a premium rate phone number", () => expect(validatePhone("0813458765")).toBe(false))
  it("should throw error as it's malformed", () => expect(validatePhone("0013458765")).toBe(false))
  describe("validate international format", () => {
    it.each(phoneExample)("should validate %s phone number ", (siret) => {
      expect(validatePhone(siret)).toBe(true)
    })
  })
})
