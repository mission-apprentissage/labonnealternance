import { describe, expect, it } from "vitest"

import { toFrenchNationalPhone, validatePhone } from "./phone-validator.js"

describe("validatePhone", () => {
  it("should success converting a french number and validate it", () => expect(validatePhone("0132568790")).toBe(true))
  it("should throw error as it's a premium rate phone number", () => expect(validatePhone("0813458765")).toBe(false))
  it("should throw error as it's malformed", () => expect(validatePhone("0013458765")).toBe(false))
})

describe("toFrenchNationalPhone", () => {
  it.each([
    ["0612345678", "0612345678"],
    ["06 12 34 56 78", "0612345678"],
    ["06.12.34.56.78", "0612345678"],
    ["06-12-34-56-78", "0612345678"],
    ["+33612345678", "0612345678"],
    ["+33 6 12 34 56 78", "0612345678"],
    ["+33 (0)1 32 56 87 90", "0132568790"],
    ["0132568790", "0132568790"],
    ["+262692123456", "0692123456"],
    ["+590 690 12 34 56", "0690123456"],
  ])("ramène %s à 10 chiffres", (phone, expected) => expect(toFrenchNationalPhone(phone)).toBe(expected))

  it.each([
    ["", "vide"],
    ["061234567", "trop court"],
    ["0813458765", "surtaxé"],
    ["+32470123456", "belge, 10 chiffres en national mais hors plan français"],
    ["+447400123456", "britannique"],
    ["+687123456", "calédonien, 6 chiffres"],
  ])("refuse %s (%s)", (phone) => expect(toFrenchNationalPhone(phone)).toBeNull())
})
