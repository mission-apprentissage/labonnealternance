import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { renewSearchToken, captureException } = vi.hoisted(() => ({ renewSearchToken: vi.fn(async () => undefined), captureException: vi.fn() }))
vi.mock("@/utils/search-token.client", () => ({ renewSearchToken }))
vi.mock("@sentry/nextjs", () => ({ captureException }))

import { ApiError, apiGet, apiPost, generateUrl } from "./api.utils"
import { setSearchToken } from "./search-token.store"

const fetchMock = vi.fn<typeof fetch>()
const refusal = (message: string) => Response.json({ statusCode: 401, error: "Unauthorized", message }, { status: 401 })

const asBrowser = ({ inIframe = false } = {}) => {
  const self = {}
  vi.stubGlobal("window", { self, top: inIframe ? {} : self })
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock)
  fetchMock.mockReset()
  renewSearchToken.mockClear()
  captureException.mockClear()
})
afterEach(() => vi.unstubAllGlobals())

describe("generateUrl dans le navigateur", () => {
  beforeEach(() => asBrowser())

  it.each([
    ["/v1/search", "/bff/v1/search?q=a"],
    ["/v1/search/suggest", "/bff/v1/search/suggest?q=a"],
    ["/_private/appointment", "/bff/_private/appointment?q=a"],
  ])("passe %s par le BFF", (path, expected) => {
    expect(generateUrl(path, { querystring: { q: "a" } })).toBe(expected)
  })

  it.each(["/v1/searchx", "/v3/jobs/search", "/rome", "/user"])("laisse %s sur l'API publique", (path) => {
    expect(generateUrl(path)).toMatch(/\/api\//)
  })

  it.each(["/v2/_private/application", "/V2/_private/Application", "/v2/_private/application?x=1"])("envoie la candidature %s en direct sur l'API", (path) => {
    expect(generateUrl(path)).toMatch(/\/api\/v2\/_private\/application/i)
  })

  // nginx n'ouvre que le chemin exact : tout voisin reste fermé sur /api et doit passer par le BFF.
  it.each(["/v2/_private/application/", "/v2/_private/applications", "/v1/_private/application", "/_private/application"])("garde le voisin %s sur le BFF", (path) => {
    expect(generateUrl(path)).toMatch(/^\/bff\//)
  })

  it("envoie la candidature sur l'API avec le jeton d'accès de l'offre, sans jeton de recherche", async () => {
    setSearchToken("jeton-de-recherche")
    fetchMock.mockResolvedValueOnce(Response.json({}))
    await apiPost("/v2/_private/application", { body: {} as never, headers: { authorization: "Bearer jeton-offre" } })
    const [url, init] = fetchMock.mock.calls[0]
    const headers = new Headers(init?.headers)
    expect(url).toMatch(/^https?:\/\/[^/]+\/api\/v2\/_private\/application$/)
    expect(headers.get("authorization")).toBe("Bearer jeton-offre")
    expect(headers.has("x-lba-search-token")).toBe(false)
  })
})

describe("jeton de recherche dans le navigateur", () => {
  it("rejoue une recherche une fois après un JETON_REQUIS", async () => {
    asBrowser()
    fetchMock.mockResolvedValueOnce(refusal("JETON_REQUIS")).mockResolvedValueOnce(Response.json({ hits: [], nbHits: 0, nbPages: 0 }))
    await expect(apiGet("/v1/search", { querystring: { q: "a" } as never })).resolves.toMatchObject({ nbHits: 0 })
    expect(renewSearchToken).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("rejoue après un JETON_EPUISE", async () => {
    asBrowser()
    fetchMock.mockResolvedValueOnce(refusal("JETON_EPUISE")).mockResolvedValueOnce(Response.json({ suggestions: [] }))
    await apiGet("/v1/search/suggest", { querystring: { q: "abc" } as never })
    expect(renewSearchToken).toHaveBeenCalledTimes(1)
  })

  it("ne rejoue pas un autre 401", async () => {
    asBrowser()
    fetchMock.mockResolvedValueOnce(refusal("Unauthorized"))
    await expect(apiGet("/v1/search", { querystring: { q: "a" } as never })).rejects.toThrow()
    expect(renewSearchToken).not.toHaveBeenCalled()
  })

  it("ne rejoue pas un JETON_REQUIS sur une route hors recherche", async () => {
    asBrowser()
    fetchMock.mockResolvedValueOnce(refusal("JETON_REQUIS"))
    await expect(apiGet("/_private/appointment", { querystring: {} as never })).rejects.toThrow()
    expect(renewSearchToken).not.toHaveBeenCalled()
  })

  it("rend une ApiError 401 et signale l'échec quand la preuve de travail échoue", async () => {
    asBrowser()
    const failure = new Error("preuve de travail non résolue")
    renewSearchToken.mockRejectedValueOnce(failure)
    fetchMock.mockResolvedValueOnce(refusal("JETON_REQUIS"))
    const error = await apiGet("/v1/search", { querystring: { q: "a" } as never }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).context).toMatchObject({ statusCode: 401, message: "JETON_REQUIS" })
    expect(captureException).toHaveBeenCalledWith(failure)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("ne rejoue qu'une fois si le second appel est encore refusé", async () => {
    asBrowser()
    fetchMock.mockResolvedValue(refusal("JETON_REQUIS"))
    await expect(apiGet("/v1/search", { querystring: { q: "a" } as never })).rejects.toThrow()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("envoie le jeton en mémoire en en-tête, et le jeton renouvelé au rejeu", async () => {
    asBrowser()
    setSearchToken("v1.k1.1.n.ancien")
    renewSearchToken.mockImplementationOnce(async () => setSearchToken("v1.k1.1.n.nouveau"))
    fetchMock.mockResolvedValueOnce(refusal("JETON_EPUISE")).mockResolvedValueOnce(Response.json({ hits: [] }))
    await apiGet("/v1/search", { querystring: { q: "a" } as never })
    const sentTokens = fetchMock.mock.calls.map(([, init]) => new Headers(init?.headers).get("x-lba-search-token"))
    expect(sentTokens).toEqual(["v1.k1.1.n.ancien", "v1.k1.1.n.nouveau"])
  })

  it("n'envoie pas le jeton en mémoire hors recherche", async () => {
    asBrowser()
    setSearchToken("v1.k1.1.n.memoire")
    fetchMock.mockResolvedValueOnce(Response.json({}))
    await apiGet("/_private/appointment", { querystring: {} as never })
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).has("x-lba-search-token")).toBe(false)
  })

  it.each([
    [false, "site"],
    [true, "widget"],
  ])("annonce le canal (iframe=%s → %s)", async (inIframe, channel) => {
    asBrowser({ inIframe })
    fetchMock.mockResolvedValueOnce(Response.json({ hits: [] }))
    await apiGet("/v1/search", { querystring: { q: "a" } as never })
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get("x-lba-channel")).toBe(channel)
  })
})
