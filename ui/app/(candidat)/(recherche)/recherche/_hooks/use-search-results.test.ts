import { InfiniteQueryObserver, QueryClient, QueryObserver } from "@tanstack/react-query"
import { describe, expect, it, vi } from "vitest"
import { apiGet } from "@/utils/api.utils"

import { emploisFallbackQueryOptions } from "./use-emplois-fallback-count"
import { paramsToQuerystring, searchResultsQueryOptions } from "./use-search-results"

vi.mock("@/utils/api.utils", () => ({ apiGet: vi.fn() }))

describe("paramsToQuerystring", () => {
  it("transmet l'OPCO à /v1/search", () => {
    expect(paramsToQuerystring({ mode: "emplois", radius: 20, page: 0, hitsPerPage: 20, opco: "AKTO" })).toMatchObject({ opco: "AKTO" })
  })

  it("n'envoie pas de paramètre opco sans filtre", () => {
    expect(paramsToQuerystring({ mode: "emplois", radius: 20, page: 0, hitsPerPage: 20 })).not.toHaveProperty("opco")
  })
})

// Pendant de la garde testée dans search.tracking.utils.test.ts (#6052) : au retour sur A, le
// cache sert les données sans appel serveur, et l'effet d'affichage les voit comme fraîches.
describe("retour sur une recherche déjà chargée (A → B → A)", () => {
  const qsA = { mode: "emplois_formation", q: "notaire", radius: 100, hitsPerPage: 20 }
  const qsB = { ...qsA, mode: "emplois" }

  it("sert les résultats de A depuis le cache, sans appel ni placeholder", async () => {
    vi.mocked(apiGet).mockReset().mockResolvedValue({ hits: [], nbHits: 0, nbPages: 0 })
    const observer = new InfiniteQueryObserver(new QueryClient(), searchResultsQueryOptions(qsA))
    const unsubscribe = observer.subscribe(vi.fn())
    try {
      await vi.waitFor(() => expect(observer.getCurrentResult().isSuccess).toBe(true))
      observer.setOptions(searchResultsQueryOptions(qsB))
      expect(observer.getCurrentResult().isPlaceholderData).toBe(true)
      await vi.waitFor(() => expect(observer.getCurrentResult().isPlaceholderData).toBe(false))

      observer.setOptions(searchResultsQueryOptions(qsA))
      const back = observer.getCurrentResult()
      expect(back).toMatchObject({ isSuccess: true, isPlaceholderData: false, isFetching: false })
      expect(apiGet).toHaveBeenCalledTimes(2)
    } finally {
      unsubscribe()
    }
  })

  it("sert le comptage de la bascule de A depuis le cache, sans appel", async () => {
    vi.mocked(apiGet).mockReset().mockResolvedValue({ hits: [], nbHits: 12 })
    const observer = new QueryObserver(new QueryClient(), emploisFallbackQueryOptions(qsA))
    const unsubscribe = observer.subscribe(vi.fn())
    try {
      await vi.waitFor(() => expect(observer.getCurrentResult().isSuccess).toBe(true))
      observer.setOptions(emploisFallbackQueryOptions(qsB))
      await vi.waitFor(() => expect(observer.getCurrentResult()).toMatchObject({ isSuccess: true, isFetching: false }))

      observer.setOptions(emploisFallbackQueryOptions(qsA))
      expect(observer.getCurrentResult()).toMatchObject({ isPending: false, isFetching: false })
      expect(apiGet).toHaveBeenCalledTimes(2)
    } finally {
      unsubscribe()
    }
  })
})
