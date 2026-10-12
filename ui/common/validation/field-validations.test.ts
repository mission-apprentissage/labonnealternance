import { describe, expect, it } from "vitest"

import { emailValidation, frenchPhoneValidation } from "./field-validations"

describe("emailValidation", () => {
  it.each(["nom@domaine.fr", "prenom.nom@sous.domaine.com", "a+b@beta.gouv.fr"])("accepte %s", (email) => expect(emailValidation().isValidSync(email)).toBe(true))

  it.each(["a.b@c", "entreprise@beta", "nom@domaine.", "nom domaine.fr", "nom@@domaine.fr"])("refuse %s, comme z.email() côté serveur", (email) =>
    expect(emailValidation().isValidSync(email)).toBe(false)
  )
})

describe("frenchPhoneValidation", () => {
  it.each(["0630104152", "+33 6 30 10 41 52", "06.30.10.41.52"])("accepte %s", (phone) => expect(frenchPhoneValidation().isValidSync(phone)).toBe(true))

  it.each(["+33 6 30 10 41 52ssss", "06a30104152"])("refuse %s", (phone) => expect(frenchPhoneValidation().isValidSync(phone)).toBe(false))
})
