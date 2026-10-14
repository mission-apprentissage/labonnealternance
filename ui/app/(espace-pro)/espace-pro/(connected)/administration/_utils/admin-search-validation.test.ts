import { describe, expect, it } from "vitest"

import { OFFER_ID_EXAMPLE, validateLbaCompanySearch, validateMinLength, validateOfferId } from "./admin-search-validation"

describe("validateMinLength", () => {
  it("refuse une recherche vide ou d'un caractère", () => {
    expect(validateMinLength("")).toBe("Saisissez au moins 2 caractères")
    expect(validateMinLength("a")).toBe("Saisissez au moins 2 caractères")
  })

  it("accepte une recherche de 2 caractères", () => {
    expect(validateMinLength("ab")).toBeNull()
  })
})

describe("validateOfferId", () => {
  it("accepte un identifiant de 24 caractères hexadécimaux, quelle que soit la casse", () => {
    expect(validateOfferId(OFFER_ID_EXAMPLE)).toBeNull()
    expect(validateOfferId(OFFER_ID_EXAMPLE.toUpperCase())).toBeNull()
  })

  it("refuse un identifiant vide, trop court ou non hexadécimal, avec un exemple", () => {
    for (const search of ["", OFFER_ID_EXAMPLE.slice(1), `${OFFER_ID_EXAMPLE.slice(1)}z`]) {
      expect(validateOfferId(search)).toContain(`par exemple ${OFFER_ID_EXAMPLE}`)
    }
  })
})

describe("validateLbaCompanySearch", () => {
  it("applique le minimum de 2 caractères à tous les champs", () => {
    expect(validateLbaCompanySearch("a", "workplace_legal_name")).toBe("Saisissez au moins 2 caractères")
    expect(validateLbaCompanySearch("a", "workplace_siret")).toBe("Saisissez au moins 2 caractères")
    expect(validateLbaCompanySearch("ab", "workplace_legal_name")).toBeNull()
  })

  it("exige un SIRET valide quand le champ ciblé est le SIRET", () => {
    expect(validateLbaCompanySearch("1234567890", "workplace_siret")).toContain("Saisissez un SIRET valide")
    expect(validateLbaCompanySearch("12345678901234", "workplace_siret")).toContain("Saisissez un SIRET valide")
    expect(validateLbaCompanySearch("73282932000074", "workplace_siret")).toBeNull()
  })

  it("n'applique pas la règle SIRET aux autres champs", () => {
    expect(validateLbaCompanySearch("1234", "apply_phone")).toBeNull()
  })
})
