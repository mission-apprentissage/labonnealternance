import { describe, expect, it } from "vitest"

import { matchesKnownUiRoute, matchesScope, scopePatternsOverlap } from "./ui-routes.utils.js"

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

describe("matchesScope", () => {
  it("compare un chemin littéral à l'identique", () => {
    expect(matchesScope("/recherche", "/recherche")).toBe(true)
    expect(matchesScope("/recherche", "/recherche/")).toBe(true)
    expect(matchesScope("/", "/")).toBe(true)
    expect(matchesScope("/recherche", "/recherche-emploi")).toBe(false)
    expect(matchesScope("/recherche", "/")).toBe(false)
    expect(matchesScope("/", "/recherche")).toBe(false)
  })

  it("accepte n'importe quel segment en face de :param, mais pas un segment de plus ou de moins", () => {
    expect(matchesScope("/formation/:id/:titre", "/formation/123/cap-cuisine")).toBe(true)
    expect(matchesScope("/formation/:id/:titre", "/formation/123")).toBe(false)
    expect(matchesScope("/formation/:id/:titre", "/formation/123/cap-cuisine/autre")).toBe(false)
    expect(matchesScope("/formation/:id/:titre", "/emploi/123/cap-cuisine")).toBe(false)
  })

  it("couvre toute la sous-arborescence avec * final, page de départ comprise", () => {
    expect(matchesScope("/guide-alternant/*", "/guide-alternant")).toBe(true)
    expect(matchesScope("/guide-alternant/*", "/guide-alternant/comprendre-la-remuneration")).toBe(true)
    expect(matchesScope("/guide-alternant/*", "/guide-alternant/a/b")).toBe(true)
    expect(matchesScope("/guide-alternant/*", "/guide-recruteur")).toBe(false)
    expect(matchesScope("/*", "/")).toBe(true)
    expect(matchesScope("/*", "/recherche")).toBe(true)
  })
})

describe("scopePatternsOverlap", () => {
  it("détecte deux chemins identiques ou compatibles segment à segment", () => {
    expect(scopePatternsOverlap("/recherche", "/recherche")).toBe(true)
    expect(scopePatternsOverlap("/formation/:id/:titre", "/formation/:x/:y")).toBe(true)
    expect(scopePatternsOverlap("/emploi/:type/:id/:titre", "/emploi/matcha/:id/:titre")).toBe(true)
  })

  it("détecte une sous-arborescence qui contient l'autre chemin", () => {
    expect(scopePatternsOverlap("/formation/*", "/formation/:id/:titre")).toBe(true)
    expect(scopePatternsOverlap("/formation/:id/:titre", "/formation/*")).toBe(true)
    expect(scopePatternsOverlap("/guide/*", "/guide")).toBe(true)
    expect(scopePatternsOverlap("/*", "/recherche")).toBe(true)
    expect(scopePatternsOverlap("/guide/*", "/guide/a/*")).toBe(true)
  })

  it("laisse passer des chemins distincts", () => {
    expect(scopePatternsOverlap("/recherche", "/formation/*")).toBe(false)
    expect(scopePatternsOverlap("/formation/:id/:titre", "/formation/:id")).toBe(false)
    expect(scopePatternsOverlap("/emploi/matcha/:id/:titre", "/emploi/lba/:id/:titre")).toBe(false)
    expect(scopePatternsOverlap("/guide/a/*", "/guide/b/*")).toBe(false)
    expect(scopePatternsOverlap("/guide/a/*", "/guide")).toBe(false)
  })
})
