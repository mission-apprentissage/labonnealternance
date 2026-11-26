import { describe, expect, it } from "vitest"

import { isResultsStatusWaiting, searchResultsStatus } from "./search-results-status"

const idle = { status: "idle" } as const

describe("searchResultsStatus", () => {
  it("annonce le nombre de résultats", () => {
    expect(searchResultsStatus({ errorDisplay: "none", hasData: true, waiting: false, nbHits: 12, emploisFallback: idle })).toBe("12 résultats")
  })

  it("annonce l'état vide seul hors comptage", () => {
    expect(searchResultsStatus({ errorDisplay: "none", hasData: true, waiting: false, nbHits: 0, emploisFallback: idle })).toBe("Aucun résultat")
  })

  it("annonce l'état vide et la proposition du mode emplois en un seul message", () => {
    expect(searchResultsStatus({ errorDisplay: "none", hasData: true, waiting: false, nbHits: 0, emploisFallback: { status: "done", count: 55 } })).toBe(
      "Aucun résultat. Le mode « Emplois uniquement » trouve 55 résultats"
    )
  })

  it("annonce l'état vide seul quand le mode emplois ne trouve rien non plus", () => {
    expect(searchResultsStatus({ errorDisplay: "none", hasData: true, waiting: false, nbHits: 0, emploisFallback: { status: "done", count: 0 } })).toBe("Aucun résultat")
  })

  it.each([
    ["avant la première réponse", { hasData: false, waiting: false, emploisFallback: idle }],
    ["pendant une requête ou un palier d'élargissement", { hasData: true, waiting: true, emploisFallback: idle }],
    ["pendant le comptage en mode emplois", { hasData: true, waiting: false, emploisFallback: { status: "pending" } as const }],
  ])("n'annonce rien %s", (_label, state) => {
    expect(searchResultsStatus({ ...state, errorDisplay: "none", nbHits: 0 })).toBe("")
  })

  it.each([
    ["au premier chargement, pendant un palier d'élargissement", "rate_limited", { hasData: false, waiting: true, nbHits: 0 }],
    ["après des résultats déjà affichés", "rate_limited_after_results", { hasData: true, waiting: false, nbHits: 1140 }],
  ] as const)("annonce le dépassement du débit %s", (_label, errorDisplay, state) => {
    expect(searchResultsStatus({ ...state, errorDisplay, emploisFallback: idle })).toBe("Trop de recherches ont été lancées en peu de temps. Réessayez dans quelques secondes.")
  })

  it("laisse l'erreur générique à son alerte", () => {
    expect(searchResultsStatus({ errorDisplay: "generic", hasData: false, waiting: false, nbHits: 0, emploisFallback: idle })).toBe("")
  })
})

describe("isResultsStatusWaiting", () => {
  it.each([
    ["nouvelle recherche ou rechargement", true, { isFetching: true, isFetchingNextPage: false, isError: false }],
    ["« Voir plus », que la liste annonce elle-même", false, { isFetching: true, isFetchingNextPage: true, isError: false }],
    ["« Voir plus » relancé après une erreur, pour retirer le message", true, { isFetching: true, isFetchingNextPage: true, isError: true }],
    ["aucune requête en cours", false, { isFetching: false, isFetchingNextPage: false, isError: true }],
  ])("%s → compteur vidé : %s", (_label, expected, result) => {
    expect(isResultsStatusWaiting(result)).toBe(expected)
  })
})
