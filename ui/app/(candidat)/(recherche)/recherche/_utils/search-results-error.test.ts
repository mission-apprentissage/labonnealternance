import { describe, expect, it } from "vitest"
import { ApiError } from "@/utils/api.utils"

import { searchResultsErrorDisplay, shouldRetrySearch } from "./search-results-error"

const apiError = (res: Response) => ApiError.build("/v1/search", new Headers(), {}, res)

// Réponse de @lba_limite_bff_recherche (.infra/files/configs/reverse_proxy/locations/90_location_ui.conf.template).
const nginx429 = () =>
  apiError(
    new Response('{"statusCode":429,"error":"Too Many Requests","message":"limite bff_recherche"}', {
      status: 429,
      headers: { "Content-Type": "application/json", "X-LBA-Limite": "bff_recherche" },
    })
  )
const html429 = () => apiError(new Response("<html><body>429 Too Many Requests</body></html>", { status: 429, headers: { "Content-Type": "text/html" } }))
// rateLimit Fastify relayé par le BFF.
const fastify429 = () =>
  apiError(
    new Response(JSON.stringify({ statusCode: 429, error: "Too Many Requests", message: "Rate limit exceeded, retry in 1 minute" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    })
  )
const server500 = () =>
  apiError(new Response(JSON.stringify({ statusCode: 500, error: "Internal Server Error", message: "boom" }), { status: 500, headers: { "Content-Type": "application/json" } }))

describe("shouldRetrySearch", () => {
  it.each([
    ["nginx", nginx429],
    ["Fastify", fastify429],
    ["corps non JSON", html429],
  ])("ne relance pas un 429 : %s", async (_label, build) => {
    expect(shouldRetrySearch(0, await build())).toBe(false)
  })

  it("relance une 500 jusqu'à la troisième tentative", async () => {
    const error = await server500()
    expect(shouldRetrySearch(0, error)).toBe(true)
    expect(shouldRetrySearch(2, error)).toBe(true)
    expect(shouldRetrySearch(3, error)).toBe(false)
  })

  it("relance une erreur réseau, qui n'est pas une ApiError", () => {
    expect(shouldRetrySearch(0, new TypeError("Failed to fetch"))).toBe(true)
  })

  it("relance une erreur qui porte un statut 429 sans être une ApiError", () => {
    expect(shouldRetrySearch(0, { context: { statusCode: 429 } })).toBe(true)
  })
})

describe("searchResultsErrorDisplay", () => {
  const withHits = { pages: [{ hits: [{}, {}] }] }
  const empty = { pages: [{ hits: [] }] }

  it("n'affiche rien hors erreur", async () => {
    expect(searchResultsErrorDisplay({ isError: false, isFetching: false, error: null, data: withHits })).toBe("none")
  })

  it("garde les résultats affichés sur un 429", async () => {
    expect(searchResultsErrorDisplay({ isError: true, isFetching: false, error: await nginx429(), data: withHits })).toBe("rate_limited_after_results")
  })

  it("affiche le message dédié au premier chargement", async () => {
    expect(searchResultsErrorDisplay({ isError: true, isFetching: false, error: await fastify429(), data: undefined })).toBe("rate_limited")
  })

  it("traite comme un premier chargement un 429 qui suit une réponse sans résultat", async () => {
    expect(searchResultsErrorDisplay({ isError: true, isFetching: false, error: await nginx429(), data: empty })).toBe("rate_limited")
  })

  it("retire le message pendant une relance, la requête restant en erreur jusqu'au succès", async () => {
    expect(searchResultsErrorDisplay({ isError: true, isFetching: true, error: await nginx429(), data: withHits })).toBe("none")
  })

  it.each([
    ["sans résultat chargé", undefined],
    ["avec des résultats chargés", withHits],
  ])("garde l'erreur générique pour une 500, %s", async (_label, data) => {
    expect(searchResultsErrorDisplay({ isError: true, isFetching: false, error: await server500(), data })).toBe("generic")
  })
})
