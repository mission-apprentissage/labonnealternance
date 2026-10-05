import { describe, expect, it } from "vitest"
import { PHONE_FORMAT_ERROR } from "@/utils/validation-messages"
import { frenchPhoneValidation, toSubmittedPhone } from "./field-validations"

describe("frenchPhoneValidation", () => {
  it.each(["0612345678", "06 12 34 56 78", "06.12.34.56.78", "+33 6 12 34 56 78", "+262 692 12 34 56", ""])("accepte %s", async (phone) => {
    await expect(frenchPhoneValidation().validate(phone)).resolves.toBe(phone)
  })

  it.each(["061234567", "0813458765", "+32470123456"])("refuse %s avec le message d'exemple", async (phone) => {
    await expect(frenchPhoneValidation().validate(phone)).rejects.toThrow(PHONE_FORMAT_ERROR)
  })
})

describe("toSubmittedPhone", () => {
  it("ramène le téléphone saisi à 10 chiffres", () => {
    expect(toSubmittedPhone("06 12 34 56 78")).toBe("0612345678")
    expect(toSubmittedPhone("+33612345678")).toBe("0612345678")
    expect(toSubmittedPhone("+262 692 12 34 56")).toBe("0692123456")
  })

  it("envoie une chaîne vide pour un téléphone absent", () => {
    expect(toSubmittedPhone(undefined)).toBe("")
    expect(toSubmittedPhone("")).toBe("")
  })
})
