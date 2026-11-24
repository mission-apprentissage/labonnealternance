import { describe, expect, it } from "vitest"

import { searchResultsStatus } from "./search-results-status"

const idle = { status: "idle" } as const

describe("searchResultsStatus", () => {
  it("annonce le nombre de résultats", () => {
    expect(searchResultsStatus({ hasData: true, waiting: false, nbHits: 12, emploisFallback: idle })).toBe("12 résultats")
  })

  it("annonce l'état vide seul hors comptage", () => {
    expect(searchResultsStatus({ hasData: true, waiting: false, nbHits: 0, emploisFallback: idle })).toBe("Aucun résultat")
  })

  it("annonce l'état vide et la proposition du mode emplois en un seul message", () => {
    expect(searchResultsStatus({ hasData: true, waiting: false, nbHits: 0, emploisFallback: { status: "done", count: 55 } })).toBe(
      "Aucun résultat. Le mode « Emplois uniquement » trouve 55 résultats"
    )
  })

  it("annonce l'état vide seul quand le mode emplois ne trouve rien non plus", () => {
    expect(searchResultsStatus({ hasData: true, waiting: false, nbHits: 0, emploisFallback: { status: "done", count: 0 } })).toBe("Aucun résultat")
  })

  it.each([
    ["avant la première réponse", { hasData: false, waiting: false, emploisFallback: idle }],
    ["pendant une requête ou un palier d'élargissement", { hasData: true, waiting: true, emploisFallback: idle }],
    ["pendant le comptage en mode emplois", { hasData: true, waiting: false, emploisFallback: { status: "pending" } as const }],
  ])("n'annonce rien %s", (_label, state) => {
    expect(searchResultsStatus({ ...state, nbHits: 0 })).toBe("")
  })
})
