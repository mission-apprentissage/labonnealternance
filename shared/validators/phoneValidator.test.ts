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
  it("should convert a french number and validate it", () => expect(validatePhone("0132568790")).toBe(true))
  describe("validate international format", () => {
    it.each(phoneExample)("should validate %s phone number ", (siret) => {
      expect(validatePhone(siret)).toBe(true)
    })
  })
})
