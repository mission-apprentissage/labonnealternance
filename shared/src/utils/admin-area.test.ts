import { describe, expect, it } from "vitest"

import { parseAdminArea } from "./admin-area.js"

describe("parseAdminArea", () => {
  // Les cas qui doivent répondre "non" d'abord : c'est une saisie qui arrive de l'URL.
  it.each([
    ["chaîne vide", ""],
    ["valeur absente", undefined],
    ["maille inconnue", "epci:244400404"],
    ["sans code", "region:"],
    ["sans maille", ":53"],
    ["code trop long", "departement:44000"],
    ["code non administratif", "departement:nantes"],
    ["segment en trop", "region:53:extra"],
    ["corse en minuscules", "departement:2a"],
    ["injection", "region:53; drop"],
  ])("rejette %s", (_, value) => {
    expect(parseAdminArea(value)).toBeNull()
  })

  it("accepte les deux mailles", () => {
    expect(parseAdminArea("region:53")).toEqual({ kind: "region", code: "53" })
    expect(parseAdminArea("departement:44")).toEqual({ kind: "departement", code: "44" })
  })

  it("accepte la Corse et les DROM", () => {
    expect(parseAdminArea("departement:2A")).toEqual({ kind: "departement", code: "2A" })
    expect(parseAdminArea("departement:2B")).toEqual({ kind: "departement", code: "2B" })
    expect(parseAdminArea("departement:974")).toEqual({ kind: "departement", code: "974" })
    expect(parseAdminArea("region:04")).toEqual({ kind: "region", code: "04" })
  })
})
