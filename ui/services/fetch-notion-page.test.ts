import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { getPage, captureException } = vi.hoisted(() => ({
  getPage: vi.fn(),
  captureException: vi.fn(),
}))

vi.mock("notion-client", () => ({
  NotionAPI: class {
    getPage = getPage
  },
}))
vi.mock("next/cache", () => ({ cacheLife: vi.fn() }))
vi.mock("@sentry/nextjs", () => ({ captureException }))

// Le service garde un cache au niveau du module : chaque test repart d'une instance neuve.
const importService = async () => {
  vi.resetModules()
  return await import("./fetch-notion-page")
}

const rateLimited = () => Object.assign(new Error('[POST] "https://app.notion.com/api/v3/loadPageChunk": 429 '), { statusCode: 429 })
const recordMap = (label: string) => ({ block: { [label]: {} } }) as any

beforeEach(() => {
  vi.useFakeTimers()
  getPage.mockReset()
  captureException.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe("fetchNotionPage", () => {
  it("ne rappelle pas Notion quand la page est déjà en cache", async () => {
    getPage.mockResolvedValue(recordMap("a"))
    const { fetchNotionPage } = await importService()

    await fetchNotionPage("page-1")
    await fetchNotionPage("page-1")

    expect(getPage).toHaveBeenCalledTimes(1)
  })

  it("dédoublonne les appels concurrents sur la même page", async () => {
    getPage.mockResolvedValue(recordMap("a"))
    const { fetchNotionPage } = await importService()

    await Promise.all([fetchNotionPage("page-1"), fetchNotionPage("page-1"), fetchNotionPage("page-1")])

    expect(getPage).toHaveBeenCalledTimes(1)
  })

  it("retente après un 429 puis renvoie le contenu", async () => {
    getPage.mockRejectedValueOnce(rateLimited()).mockRejectedValueOnce(rateLimited()).mockResolvedValue(recordMap("a"))
    const { fetchNotionPage } = await importService()

    const promise = fetchNotionPage("page-1")
    await vi.runAllTimersAsync()

    expect(await promise).toEqual(recordMap("a"))
    expect(getPage).toHaveBeenCalledTimes(3)
  })

  it("abandonne après 3 tentatives si le 429 persiste", async () => {
    getPage.mockRejectedValue(rateLimited())
    const { fetchNotionPage } = await importService()

    // Le handler est attaché avant de dérouler les timers, sinon le rejet est vu comme non géré.
    const assertion = expect(fetchNotionPage("page-1")).rejects.toThrow("429")
    await vi.runAllTimersAsync()

    await assertion
    expect(getPage).toHaveBeenCalledTimes(4)
  })

  it("ne retente pas sur une erreur non transitoire", async () => {
    getPage.mockRejectedValue(Object.assign(new Error("not found"), { statusCode: 404 }))
    const { fetchNotionPage } = await importService()

    const assertion = expect(fetchNotionPage("page-1")).rejects.toThrow("not found")
    await vi.runAllTimersAsync()

    await assertion
    expect(getPage).toHaveBeenCalledTimes(1)
  })

  it("sert la dernière version connue quand le rafraîchissement échoue", async () => {
    getPage.mockResolvedValueOnce(recordMap("v1"))
    const { fetchNotionPage } = await importService()
    expect(await fetchNotionPage("page-1")).toEqual(recordMap("v1"))

    // Au-delà du TTL de 24h, la page est rafraîchie — et Notion répond 429.
    vi.advanceTimersByTime(25 * 60 * 60 * 1_000)
    getPage.mockRejectedValue(rateLimited())

    const promise = fetchNotionPage("page-1")
    await vi.runAllTimersAsync()

    expect(await promise).toEqual(recordMap("v1"))
    expect(captureException).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ level: "warning" }))
  })
})
