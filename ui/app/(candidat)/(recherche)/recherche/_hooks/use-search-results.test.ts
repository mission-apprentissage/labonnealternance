import { InfiniteQueryObserver, QueryClient, QueryObserver } from "@tanstack/react-query"
import { describe, expect, it, vi } from "vitest"
import { ApiError, apiGet } from "@/utils/api.utils"
import type { ISearchPageParams } from "../_utils/search.params.utils"
import { searchResultsErrorDisplay } from "../_utils/search-results-error"
import { emploisFallbackQueryOptions } from "./use-emplois-fallback-count"
import { paramsToQuerystring, searchKeyOf, searchResultsQueryOptions } from "./use-search-results"

vi.mock("@/utils/api.utils", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/utils/api.utils")>()), apiGet: vi.fn() }))

describe("paramsToQuerystring", () => {
  it("transmet l'OPCO à /v1/search", () => {
    expect(paramsToQuerystring({ mode: "emplois", radius: 20, page: 0, hitsPerPage: 20, opco: "AKTO" })).toMatchObject({ opco: "AKTO" })
  })

  it("n'envoie pas de paramètre opco sans filtre", () => {
    expect(paramsToQuerystring({ mode: "emplois", radius: 20, page: 0, hitsPerPage: 20 })).not.toHaveProperty("opco")
  })
})

describe("searchKeyOf", () => {
  const base: ISearchPageParams = { mode: "emplois", q: "boulanger", radius: 30, page: 0, hitsPerPage: 20, latitude: 47.2, longitude: -1.55 }
  const cacheKey = (p: ISearchPageParams) => JSON.stringify(searchResultsQueryOptions(paramsToQuerystring(p)).queryKey)

  // Une recherche que le cache sert sans appel serveur ne doit pas être suivie deux fois, et une
  // recherche qui part au serveur doit l'être : les deux clés découpent de la même façon.
  it.each<[string, ISearchPageParams, ISearchPageParams]>([
    ["autre page", base, { ...base, page: 2 }],
    ["autre libellé de lieu, mêmes coordonnées", base, { ...base, lieu_label: "Nantes 44000" }],
    ["origine sans mot-clé", { ...base, q: undefined }, { ...base, q: undefined, q_source: "suggestion" }],
    ["origine de q différente", base, { ...base, q_source: "suggestion" }],
    ["autre mode", base, { ...base, mode: "formations" }],
    ["filtre ajouté", base, { ...base, urgent: true }],
  ])("suit le découpage du cache : %s", (_label, a, b) => {
    expect(searchKeyOf(a) === searchKeyOf(b)).toBe(cacheKey(a) === cacheKey(b))
  })

  it("distingue une même recherche relancée avec une autre origine de q, qui repart au serveur", () => {
    expect(searchKeyOf({ ...base, q_source: "suggestion" })).not.toBe(searchKeyOf({ ...base, q_source: "free_text" }))
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

describe("erreurs de /v1/search", () => {
  const qs = { mode: "emplois", q: "boulanger", radius: 30, hitsPerPage: 20 }
  const apiError = (status: number) => ApiError.build("/v1/search", new Headers(), {}, new Response("", { status }))
  // Défaut de React Query dans le navigateur (3 relances, 0 sous Node), sans délai : ne s'appliquent
  // que si les options de la recherche ne les fixent pas.
  const client = () => new QueryClient({ defaultOptions: { queries: { retry: 3, retryDelay: 0 } } })

  const settle = async (observer: InfiniteQueryObserver<any, any, any, any, any>) => {
    await vi.waitFor(() => expect(observer.getCurrentResult()).toMatchObject({ isFetching: false, isPending: false }))
    return observer.getCurrentResult()
  }

  it("ne relance pas une réponse 429", async () => {
    vi.mocked(apiGet)
      .mockReset()
      .mockRejectedValue(await apiError(429))
    const observer = new InfiniteQueryObserver(client(), searchResultsQueryOptions(qs))
    const unsubscribe = observer.subscribe(vi.fn())
    try {
      expect((await settle(observer)).isError).toBe(true)
      expect(apiGet).toHaveBeenCalledTimes(1)
    } finally {
      unsubscribe()
    }
  })

  it("relance trois fois une réponse 500", async () => {
    vi.mocked(apiGet)
      .mockReset()
      .mockRejectedValue(await apiError(500))
    const observer = new InfiniteQueryObserver(client(), searchResultsQueryOptions(qs))
    const unsubscribe = observer.subscribe(vi.fn())
    try {
      expect((await settle(observer)).isError).toBe(true)
      expect(apiGet).toHaveBeenCalledTimes(4)
    } finally {
      unsubscribe()
    }
  })

  it("garde les pages chargées quand « Voir plus » reçoit un 429", async () => {
    vi.mocked(apiGet)
      .mockReset()
      .mockResolvedValueOnce({ hits: [{ _id: "a" }], nbHits: 40, nbPages: 2 })
      .mockRejectedValueOnce(await apiError(429))
    const observer = new InfiniteQueryObserver(client(), searchResultsQueryOptions(qs))
    const unsubscribe = observer.subscribe(vi.fn())
    try {
      await settle(observer)
      await observer.fetchNextPage()
      const result = await settle(observer)
      expect(result.data?.pages).toHaveLength(1)
      expect(searchResultsErrorDisplay(result)).toBe("rate_limited_after_results")
      expect(apiGet).toHaveBeenCalledTimes(2)
    } finally {
      unsubscribe()
    }
  })

  // Rechargement des pages périmées, au retour d'une fiche : React Query redemande chaque page depuis la première.
  it("garde les pages chargées quand leur rechargement reçoit un 429", async () => {
    vi.mocked(apiGet)
      .mockReset()
      .mockResolvedValueOnce({ hits: [{ _id: "a" }], nbHits: 40, nbPages: 2 })
      .mockResolvedValueOnce({ hits: [{ _id: "b" }], nbHits: 40, nbPages: 2 })
      .mockResolvedValueOnce({ hits: [{ _id: "a" }], nbHits: 40, nbPages: 2 })
      .mockRejectedValueOnce(await apiError(429))
    const observer = new InfiniteQueryObserver(client(), searchResultsQueryOptions(qs))
    const unsubscribe = observer.subscribe(vi.fn())
    try {
      await settle(observer)
      await observer.fetchNextPage()
      await settle(observer)
      await observer.refetch()
      const result = await settle(observer)
      expect(result.data?.pages).toHaveLength(2)
      expect(searchResultsErrorDisplay(result)).toBe("rate_limited_after_results")
      expect(apiGet).toHaveBeenCalledTimes(4)
    } finally {
      unsubscribe()
    }
  })
})
