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

const HOUR_MS = 60 * 60 * 1_000
const rateLimited = () => Object.assign(new Error('[POST] "https://app.notion.com/api/v3/loadPageChunk": 429 '), { statusCode: 429 })
// Cas réel d'une requête qui n'aboutit pas : ofetch n'expose alors aucun statut HTTP.
const networkDown = () => new Error('[POST] "https://app.notion.com/api/v3/loadPageChunk": <no response> (ECONNRESET)')
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

  it("dédoublonne les appels concurrents sur la même page, sans mélanger les pages", async () => {
    getPage.mockImplementation((pageId: string) => Promise.resolve(recordMap(pageId)))
    const { fetchNotionPage } = await importService()

    const [a, b, c, other] = await Promise.all([fetchNotionPage("page-1"), fetchNotionPage("page-1"), fetchNotionPage("page-1"), fetchNotionPage("page-2")])

    expect(getPage).toHaveBeenCalledTimes(2)
    expect([a, b, c]).toEqual([recordMap("page-1"), recordMap("page-1"), recordMap("page-1")])
    expect(other).toEqual(recordMap("page-2"))
  })

  it("retente après un 429 puis renvoie le contenu", async () => {
    getPage.mockRejectedValueOnce(rateLimited()).mockRejectedValueOnce(rateLimited()).mockResolvedValue(recordMap("a"))
    const { fetchNotionPage } = await importService()

    const promise = fetchNotionPage("page-1")
    await vi.runAllTimersAsync()

    expect(await promise).toEqual(recordMap("a"))
    expect(getPage).toHaveBeenCalledTimes(3)
  })

  it("retente aussi quand la requête n'aboutit pas (panne réseau, sans statut HTTP)", async () => {
    getPage.mockRejectedValueOnce(networkDown()).mockResolvedValue(recordMap("a"))
    const { fetchNotionPage } = await importService()

    const promise = fetchNotionPage("page-1")
    await vi.runAllTimersAsync()

    expect(await promise).toEqual(recordMap("a"))
    expect(getPage).toHaveBeenCalledTimes(2)
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

  it("laisse respirer l'API après un échec au lieu de relancer un cycle de tentatives", async () => {
    getPage.mockRejectedValue(rateLimited())
    const { fetchNotionPage } = await importService()

    const first = expect(fetchNotionPage("page-1")).rejects.toThrow("429")
    await vi.runAllTimersAsync()
    await first
    expect(getPage).toHaveBeenCalledTimes(4)

    // Requête suivante pendant le cooldown : aucun appel réseau supplémentaire.
    const second = expect(fetchNotionPage("page-1")).rejects.toThrow("indisponible")
    await vi.runAllTimersAsync()
    await second
    expect(getPage).toHaveBeenCalledTimes(4)

    // Une fois le cooldown écoulé, on réessaie.
    vi.advanceTimersByTime(61 * 1_000)
    getPage.mockResolvedValue(recordMap("a"))
    const third = fetchNotionPage("page-1")
    await vi.runAllTimersAsync()

    expect(await third).toEqual(recordMap("a"))
    expect(getPage).toHaveBeenCalledTimes(5)
  })

  it("sert immédiatement la version périmée et la rafraîchit en tâche de fond", async () => {
    getPage.mockResolvedValueOnce(recordMap("v1"))
    const { fetchNotionPage } = await importService()
    expect(await fetchNotionPage("page-1")).toEqual(recordMap("v1"))

    vi.advanceTimersByTime(25 * HOUR_MS)
    getPage.mockResolvedValue(recordMap("v2"))

    // La requête qui déclenche le rafraîchissement ne paie pas la latence : elle reçoit v1.
    expect(await fetchNotionPage("page-1")).toEqual(recordMap("v1"))
    await vi.runAllTimersAsync()

    // La suivante bénéficie du contenu rafraîchi en arrière-plan.
    expect(await fetchNotionPage("page-1")).toEqual(recordMap("v2"))
    expect(getPage).toHaveBeenCalledTimes(2)
  })

  it("sert la dernière version connue quand le rafraîchissement échoue", async () => {
    getPage.mockResolvedValueOnce(recordMap("v1"))
    const { fetchNotionPage } = await importService()
    expect(await fetchNotionPage("page-1")).toEqual(recordMap("v1"))

    // Au-delà du TTL de 24h, la page est rafraîchie — et Notion répond 429.
    vi.advanceTimersByTime(25 * HOUR_MS)
    getPage.mockRejectedValue(rateLimited())

    expect(await fetchNotionPage("page-1")).toEqual(recordMap("v1"))
    await vi.runAllTimersAsync()

    expect(captureException).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ level: "warning" }))
  })

  it("cesse de servir une version périmée au-delà d'une semaine", async () => {
    getPage.mockResolvedValueOnce(recordMap("v1"))
    const { fetchNotionPage } = await importService()
    await fetchNotionPage("page-1")

    vi.advanceTimersByTime(8 * 24 * HOUR_MS)
    getPage.mockRejectedValue(rateLimited())

    const assertion = expect(fetchNotionPage("page-1")).rejects.toThrow("429")
    await vi.runAllTimersAsync()

    await assertion
  })
})
