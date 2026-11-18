import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { renewSearchToken } = vi.hoisted(() => ({ renewSearchToken: vi.fn(async () => undefined) }))
vi.mock("@/utils/search-token.client", () => ({ renewSearchToken }))

import { apiGet, generateUrl } from "./api.utils"

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

  it("ne rejoue qu'une fois si le second appel est encore refusé", async () => {
    asBrowser()
    fetchMock.mockResolvedValue(refusal("JETON_REQUIS"))
    await expect(apiGet("/v1/search", { querystring: { q: "a" } as never })).rejects.toThrow()
    expect(fetchMock).toHaveBeenCalledTimes(2)
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
