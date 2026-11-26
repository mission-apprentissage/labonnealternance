import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ fetchOpcoGuideVideoUrl: vi.fn(), forgetOpcoGuideVideoUrl: vi.fn() }))
vi.mock("../../_lib/fetch-opco-guide", () => mocks)

const { GET } = await import("./route")

const fetchMock = vi.fn()
const OPCO = JSON.stringify({ user: { type: "OPCO" } })
const call = (headers: Record<string, string>, blockId = "video-1") =>
  GET(new Request("https://lba.fictif/espace-pro/opco/guide-de-moderation/video/" + blockId, { headers }), { params: Promise.resolve({ blockId }) })
const partial = (body = "x", headers: Record<string, string> = {}) =>
  new Response(body, {
    status: 206,
    headers: { "content-type": "video/mp4", "content-range": "bytes 0-0/64", "accept-ranges": "bytes", "x-amz-request-id": "interne", ...headers },
  })

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock)
  fetchMock.mockReset()
  mocks.fetchOpcoGuideVideoUrl.mockReset().mockResolvedValue("https://stockage.fictif/v.mp4")
  mocks.forgetOpcoGuideVideoUrl.mockReset()
})

describe("GET vidéo du guide OPCO", () => {
  it.each([
    ["sans session", {}],
    ["avec une session ENTREPRISE", { "x-session": JSON.stringify({ user: { type: "ENTREPRISE" } }) }],
    ["avec une session ADMIN", { "x-session": JSON.stringify({ user: { type: "ADMIN" } }) }],
    ["avec une session illisible", { "x-session": "{pas du json" }],
  ])("refuse la vidéo %s, sans lire Notion", async (_, headers) => {
    const response = await call(headers)

    expect(response.status).toBe(403)
    expect(mocks.fetchOpcoGuideVideoUrl).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("répond 404 pour un bloc qui n'est pas une vidéo du guide", async () => {
    mocks.fetchOpcoGuideVideoUrl.mockResolvedValue(null)

    expect((await call({ "x-session": OPCO }, "autre-bloc")).status).toBe(404)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("relaie la plage demandée sans exposer le lien Notion ni les en-têtes du stockage", async () => {
    fetchMock.mockResolvedValue(partial())

    const response = await call({ "x-session": OPCO, range: "bytes=0-0" })

    expect(fetchMock.mock.calls[0][0]).toBe("https://stockage.fictif/v.mp4")
    expect(fetchMock.mock.calls[0][1].headers).toEqual({ range: "bytes=0-0" })
    expect(response.status).toBe(206)
    expect(response.headers.get("content-range")).toBe("bytes 0-0/64")
    expect(response.headers.get("cache-control")).toBe("private, no-store")
    expect(response.headers.get("x-amz-request-id")).toBeNull()
    expect(response.headers.get("location")).toBeNull()
    expect(await response.text()).toBe("x")
  })

  it("renouvelle un lien refusé par le stockage et réessaie une fois", async () => {
    mocks.fetchOpcoGuideVideoUrl.mockResolvedValueOnce("https://stockage.fictif/expire.mp4").mockResolvedValueOnce("https://stockage.fictif/frais.mp4")
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 403 })).mockResolvedValueOnce(partial())

    const response = await call({ "x-session": OPCO, range: "bytes=0-0" })

    expect(mocks.forgetOpcoGuideVideoUrl).toHaveBeenCalledWith("video-1")
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(["https://stockage.fictif/expire.mp4", "https://stockage.fictif/frais.mp4"])
    expect(response.status).toBe(206)
  })

  it("répond 502 quand le stockage est en erreur", async () => {
    fetchMock.mockResolvedValue(new Response("erreur", { status: 500 }))

    expect((await call({ "x-session": OPCO })).status).toBe(502)
  })
})
