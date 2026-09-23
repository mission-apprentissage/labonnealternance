import { describe, expect, it } from "vitest"

import { matchesKnownUiRoute } from "./ui-routes.utils.js"

describe("matchesKnownUiRoute", () => {
  it("accepte un chemin littéral existant", () => {
    expect(matchesKnownUiRoute("/recherche")).toBe(true)
    expect(matchesKnownUiRoute("/")).toBe(true)
    expect(matchesKnownUiRoute("/guide-alternant/comprendre-la-remuneration")).toBe(true)
  })

  it("refuse un chemin littéral qui n'existe pas", () => {
    expect(matchesKnownUiRoute("/recherche-emploi")).toBe(false)
    expect(matchesKnownUiRoute("/entreprise/:id")).toBe(false)
    expect(matchesKnownUiRoute("/recherhce")).toBe(false)
  })

  it("accepte :param en face d'un segment dynamique, quel que soit son nom", () => {
    expect(matchesKnownUiRoute("/formation/:id/:intitule-formation")).toBe(true)
    expect(matchesKnownUiRoute("/formation/:machin/:truc")).toBe(true)
    expect(matchesKnownUiRoute("/emploi/:type/:id/:intitule")).toBe(true)
  })

  it("refuse :param en face d'un segment littéral", () => {
    expect(matchesKnownUiRoute("/alternance/:quelquechose")).toBe(false)
  })

  it("refuse un nombre de segments incorrect", () => {
    expect(matchesKnownUiRoute("/formation/:id")).toBe(false)
    expect(matchesKnownUiRoute("/recherche/:id")).toBe(false)
  })

  it("accepte * en dernier segment pour couvrir une sous-arborescence", () => {
    expect(matchesKnownUiRoute("/guide-alternant/*")).toBe(true)
    expect(matchesKnownUiRoute("/formation/*")).toBe(true)
    expect(matchesKnownUiRoute("/*")).toBe(true)
  })

  it("refuse * sur une sous-arborescence vide", () => {
    expect(matchesKnownUiRoute("/inconnu/*")).toBe(false)
  })

  it("refuse * ailleurs qu'en dernier segment", () => {
    expect(matchesKnownUiRoute("/*/recherche")).toBe(false)
  })

  it("refuse un chemin relatif ou vide", () => {
    expect(matchesKnownUiRoute("recherche")).toBe(false)
    expect(matchesKnownUiRoute("")).toBe(false)
  })

  it("tolère les espaces autour et la barre finale", () => {
    expect(matchesKnownUiRoute("  /recherche  ")).toBe(true)
    expect(matchesKnownUiRoute("/recherche/")).toBe(true)
  })
})
