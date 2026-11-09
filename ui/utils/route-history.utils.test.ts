import { describe, expect, it } from "vitest"

import { createRouteHistory } from "./route-history.utils"

describe("createRouteHistory", () => {
  it("rend le chemin affiché à l'instant demandé", () => {
    const history = createRouteHistory()
    history.record("/", 100)
    history.record("/recherche", 500)
    history.record("/emploi/offres_emploi_lba/6a30155208d7f8e3d76cf05c/chauffeur", 900)

    expect(history.pathAt(50)).toBe("/")
    expect(history.pathAt(100)).toBe("/")
    expect(history.pathAt(499)).toBe("/")
    expect(history.pathAt(700)).toBe("/recherche")
    expect(history.pathAt(5000)).toBe("/emploi/offres_emploi_lba/6a30155208d7f8e3d76cf05c/chauffeur")
  })

  it("ne rend rien tant qu'aucun chemin n'est enregistré", () => {
    expect(createRouteHistory().pathAt(10)).toBeUndefined()
  })

  it("ignore un enregistrement identique au précédent et garde un nombre borné d'entrées", () => {
    const history = createRouteHistory(2)
    history.record("/a", 1)
    history.record("/a", 2)
    history.record("/b", 3)
    history.record("/c", 4)

    expect(history.pathAt(1)).toBe("/b")
    expect(history.pathAt(3)).toBe("/b")
    expect(history.pathAt(4)).toBe("/c")
  })
})
