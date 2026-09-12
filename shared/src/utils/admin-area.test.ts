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
    ["département à un chiffre", "departement:2"],
    ["département 00", "departement:00"],
    ["département 96", "departement:96"],
    ["Saint-Barthélemy, collectivité", "departement:977"],
    ["Saint-Pierre-et-Miquelon, collectivité", "departement:975"],
    ["région inexistante", "region:12"],
    ["région 999", "region:999"],
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

  it("accepte les bornes des séries : 01, 19, 21, 95, 971, 976, et les 18 régions", () => {
    for (const code of ["01", "19", "21", "95", "971", "976"]) expect(parseAdminArea(`departement:${code}`)?.code).toBe(code)
    for (const code of ["01", "02", "03", "04", "06", "11", "24", "27", "28", "32", "44", "52", "53", "75", "76", "84", "93", "94"]) {
      expect(parseAdminArea(`region:${code}`)?.code, code).toBe(code)
    }
  })
})
