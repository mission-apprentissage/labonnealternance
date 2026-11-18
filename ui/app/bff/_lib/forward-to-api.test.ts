import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

const { buildUpstreamHeaders, buildUpstreamSearch, forwardToApi, toApiPath } = await import("./forward-to-api")

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock)
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(Response.json({ hits: [] }))
})
afterEach(() => vi.unstubAllGlobals())

const browserRequest = (url: string, headers: Record<string, string> = {}, init: { method?: string; body?: string } = {}) =>
  new NextRequest(`https://labonnealternance.test${url}`, { headers, ...init })

describe("toApiPath", () => {
  it.each([
    [["v1", "searchx"]],
    [["v1", "search", "suggestx"]],
    [["_privatex", "jobs"]],
    [["v3", "jobs"]],
    [["admin", "users"]],
    [["_private", "..", "admin", "users"]],
    [["_private", ".", "jobs"]],
    [["_private", "", "jobs"]],
    [[]],
  ])("refuse %j", (segments) => {
    expect(toApiPath(segments)).toBeNull()
  })

  it.each([
    [["v1", "search"], "/v1/search"],
    [["V1", "Search"], "/V1/Search"],
    [["v1", "search", "suggest"], "/v1/search/suggest"],
    [["_private", "jobs", "offres_emploi_lba", "abc"], "/_private/jobs/offres_emploi_lba/abc"],
    [["v2", "_private", "application"], "/v2/_private/application"],
    [["_private", "jobs", "a b/c"], "/_private/jobs/a%20b%2Fc"],
  ])("accepte %j", (segments, expected) => {
    expect(toApiPath(segments)).toBe(expected)
  })
})

describe("buildUpstreamHeaders", () => {
  it("transmet l'IP posée par nginx en X-Real-IP, jamais le X-Forwarded-For reçu", () => {
    const headers = buildUpstreamHeaders(browserRequest("/bff/v1/search", { "x-real-ip": "198.51.100.7", "x-forwarded-for": "10.0.0.1" }), "/v1/search", "jeton")
    expect(headers.get("x-forwarded-for")).toBe("198.51.100.7")
  })

  it("n'invente pas d'IP sans X-Real-IP (local), même si le navigateur pose X-Forwarded-For", () => {
    const headers = buildUpstreamHeaders(browserRequest("/bff/v1/search", { "x-forwarded-for": "10.0.0.1" }), "/v1/search", "jeton")
    expect(headers.has("x-forwarded-for")).toBe(false)
  })

  it("remplace un jeton posé en en-tête par le navigateur par celui du cookie", () => {
    const request = browserRequest("/bff/v1/search", { "x-lba-search-token": "forgé" })
    expect(buildUpstreamHeaders(request, "/v1/search", "du-cookie").get("x-lba-search-token")).toBe("du-cookie")
    expect(buildUpstreamHeaders(request, "/v1/search", undefined).has("x-lba-search-token")).toBe(false)
  })

  it("ramène un canal inconnu à site", () => {
    expect(buildUpstreamHeaders(browserRequest("/bff/v1/search", { "x-lba-channel": "api" }), "/v1/search", "j").get("x-lba-channel")).toBe("site")
    expect(buildUpstreamHeaders(browserRequest("/bff/v1/search", { "x-lba-channel": "widget" }), "/v1/search", "j").get("x-lba-channel")).toBe("widget")
  })

  it("ne pose ni canal ni jeton sur une route _private, mais relaie session et autorisation", () => {
    const headers = buildUpstreamHeaders(
      browserRequest("/bff/v2/_private/application", { "x-lba-channel": "site", cookie: "lba_session=abc", authorization: "Bearer offre" }),
      "/v2/_private/application",
      "jeton"
    )
    expect(headers.has("x-lba-channel")).toBe(false)
    expect(headers.has("x-lba-search-token")).toBe(false)
    expect(headers.get("cookie")).toBe("lba_session=abc")
    expect(headers.get("authorization")).toBe("Bearer offre")
  })
})

describe("buildUpstreamSearch", () => {
  it("retire internal, réservé au rendu serveur", () => {
    expect(buildUpstreamSearch(new URL("https://x.test/bff/v1/search?q=a&internal=true&page=2"))).toBe("?q=a&page=2")
    expect(buildUpstreamSearch(new URL("https://x.test/bff/v1/search?internal=true"))).toBe("")
  })
})

describe("forwardToApi", () => {
  it("répond 404 sans appeler l'API pour une route hors liste", async () => {
    const response = await forwardToApi(browserRequest("/bff/admin/users"), ["admin", "users"])
    expect(response.status).toBe(404)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("répond 401 JETON_REQUIS sans appeler l'API quand le cookie de jeton manque", async () => {
    const response = await forwardToApi(browserRequest("/bff/v1/search?q=a"), ["v1", "search"])
    expect(response.status).toBe(401)
    expect((await response.json()).message).toBe("JETON_REQUIS")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("relaie une recherche avec le jeton du cookie et sans cache", async () => {
    const response = await forwardToApi(browserRequest("/bff/v1/search?q=a", { cookie: "lba_st=v1.k1.1.n.m", "x-real-ip": "198.51.100.7" }), ["v1", "search"])
    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toBe("no-store")
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/api\/v1\/search\?q=a$/)
    expect(new Headers(init?.headers).get("x-lba-search-token")).toBe("v1.k1.1.n.m")
  })

  it("prend le jeton de l'en-tête quand le cookie manque (cookie partitionné refusé)", async () => {
    const response = await forwardToApi(browserRequest("/bff/v1/search?q=a", { "x-lba-search-token": "v1.k1.1.n.entete" }), ["v1", "search"])
    expect(response.status).toBe(200)
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get("x-lba-search-token")).toBe("v1.k1.1.n.entete")
  })

  it("préfère le cookie à l'en-tête", async () => {
    await forwardToApi(browserRequest("/bff/v1/search?q=a", { cookie: "lba_st=v1.k1.1.n.cookie", "x-lba-search-token": "v1.k1.1.n.entete" }), ["v1", "search"])
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get("x-lba-search-token")).toBe("v1.k1.1.n.cookie")
  })

  it("ne relaie pas un en-tête de jeton vers une route _private", async () => {
    await forwardToApi(browserRequest("/bff/_private/appointment", { "x-lba-search-token": "v1.k1.1.n.entete" }), ["_private", "appointment"])
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).has("x-lba-search-token")).toBe(false)
  })

  it("relaie le statut et le corps d'une erreur de l'API", async () => {
    fetchMock.mockResolvedValue(Response.json({ statusCode: 401, error: "Unauthorized", message: "JETON_EPUISE" }, { status: 401 }))
    const response = await forwardToApi(browserRequest("/bff/v1/search", { cookie: "lba_st=x" }), ["v1", "search"])
    expect(response.status).toBe(401)
    expect((await response.json()).message).toBe("JETON_EPUISE")
  })

  it("relaie le corps d'un POST", async () => {
    await forwardToApi(browserRequest("/bff/v2/_private/application", { "content-type": "application/json" }, { method: "POST", body: '{"a":1}' }), [
      "v2",
      "_private",
      "application",
    ])
    const [, init] = fetchMock.mock.calls[0]
    expect(init?.method).toBe("POST")
    expect(new TextDecoder().decode(init?.body as ArrayBuffer)).toBe('{"a":1}')
  })
})
