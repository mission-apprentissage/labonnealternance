import { describe, expect, it } from "vitest"

import { FEEDBACK_URL_PARAMS_MAX_KEYS, sanitizeFeedbackUrlParams } from "./feedback-url-params.js"

describe("sanitizeFeedbackUrlParams", () => {
  it("garde les paramètres ordinaires, simples ou répétés", () => {
    expect(sanitizeFeedbackUrlParams({ utm_source: "newsletter", romes: ["M1607", "M1602"], lieu_label: "Montluçon" })).toEqual({
      utm_source: "newsletter",
      romes: ["M1607", "M1602"],
      lieu_label: "Montluçon",
    })
  })

  it("retire les clés exclues, quelle que soit leur graphie", () => {
    expect(sanitizeFeedbackUrlParams({ token: "abc", Email: "x", first_name: "A", "Last-Name": "B", telephone: "1", page: "2" })).toEqual({ page: "2" })
  })

  it("retire les valeurs qui ressemblent à un email, un téléphone ou un jeton, même sous une clé anodine", () => {
    expect(
      sanitizeFeedbackUrlParams({
        contact: "jean.dupont@example.org",
        numero: "06 12 34 56 78",
        international: "+33612345678",
        session: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc-def_ghi",
        siret: "13002526500013",
        id: "123456789",
      })
    ).toEqual({ siret: "13002526500013", id: "123456789" })
  })

  it("filtre valeur par valeur dans un paramètre répété", () => {
    expect(sanitizeFeedbackUrlParams({ q: ["cuisine", "a@b.fr"] })).toEqual({ q: ["cuisine"] })
    expect(sanitizeFeedbackUrlParams({ q: ["a@b.fr"] })).toEqual({})
  })

  it("borne la longueur des valeurs et le nombre de clés", () => {
    expect(sanitizeFeedbackUrlParams({ long: "x".repeat(201), court: "x".repeat(200) })).toEqual({ court: "x".repeat(200) })
    const many = Object.fromEntries(Array.from({ length: 30 }, (_, index) => [`p${index}`, "v"]))
    expect(Object.keys(sanitizeFeedbackUrlParams(many))).toHaveLength(FEEDBACK_URL_PARAMS_MAX_KEYS)
  })
})
