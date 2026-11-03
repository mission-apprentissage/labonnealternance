import { QueryClient, QueryObserver } from "@tanstack/react-query"
import { describe, expect, it, vi } from "vitest"
import { apiGet } from "@/utils/api.utils"

import type { ISearchPageParams } from "../_utils/search.params.utils"
import { emploisFallbackQueryOptions, shouldCountEmploisFallback, toEmploisFallbackCount } from "./use-emplois-fallback-count"

vi.mock("@/utils/api.utils", () => ({ apiGet: vi.fn() }))

const params = (overrides: Partial<ISearchPageParams> = {}): ISearchPageParams => ({ mode: "emplois_formation", radius: 100, page: 0, hitsPerPage: 20, ...overrides })

const result = (nbHits: number | null, overrides: Record<string, unknown> = {}) =>
  ({ data: nbHits === null ? undefined : { pages: [{ hits: [], nbHits }] }, isPlaceholderData: false, isFetching: false, ...overrides }) as never

describe("shouldCountEmploisFallback", () => {
  it("compte à l'état vide définitif du mode emplois_formation", () => {
    expect(shouldCountEmploisFallback(params(), result(0), false)).toBe(true)
  })

  it.each([
    ["en mode emplois", params({ mode: "emplois" }), result(0), false],
    ["en mode formations", params({ mode: "formations" }), result(0), false],
    ["quand la recherche trouve des offres", params(), result(3), false],
    ["avant la première réponse", params(), result(null), false],
    ["pendant un rechargement", params(), result(0, { isFetching: true }), false],
    ["sur les données de la recherche précédente", params(), result(0, { isPlaceholderData: true }), false],
    ["pendant l'élargissement du rayon", params({ radius: 40 }), result(0), true],
  ])("ne compte pas %s", (_label, p, r, stillWidening) => {
    expect(shouldCountEmploisFallback(p, r, stillWidening)).toBe(false)
  })
})

describe("toEmploisFallbackCount", () => {
  it("reste inactif hors comptage", () => {
    expect(toEmploisFallbackCount(false, { isPending: true })).toEqual({ status: "idle" })
  })

  it("attend la réponse", () => {
    expect(toEmploisFallbackCount(true, { isPending: true })).toEqual({ status: "pending" })
  })

  it("rend le nombre de résultats", () => {
    expect(toEmploisFallbackCount(true, { isPending: false, data: { nbHits: 55 } })).toEqual({ status: "done", count: 55 })
  })

  it("rend 0 en erreur, pour afficher l'état vide sans proposition", () => {
    expect(toEmploisFallbackCount(true, { isPending: false, data: undefined })).toEqual({ status: "done", count: 0 })
  })
})

describe("emploisFallbackQueryOptions", () => {
  it("passe en erreur dès le premier échec, sans nouvelle tentative", async () => {
    vi.mocked(apiGet).mockRejectedValue(new Error("500"))
    // Sous Node, React Query ne retente pas par défaut (isServer) : on impose le défaut du navigateur.
    const client = new QueryClient({ defaultOptions: { queries: { retry: 3 } } })
    const observer = new QueryObserver(client, emploisFallbackQueryOptions({ q: "notaire" }))
    // Un abonné suffit à lancer la requête ; son contenu ne compte pas.
    const unsubscribe = observer.subscribe(vi.fn())
    try {
      // Avec les tentatives par défaut de React Query, la requête resterait en attente plus d'une seconde.
      await vi.waitFor(() => expect(observer.getCurrentResult().status).toBe("error"), { timeout: 500 })
      expect(apiGet).toHaveBeenCalledTimes(1)
    } finally {
      unsubscribe()
    }
  })
})
