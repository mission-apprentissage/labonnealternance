import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { block, sectionHeadings, text } from "./notion-guide.fixtures"

vi.mock("server-only", () => ({}))
const sentry = vi.hoisted(() => ({ captureException: vi.fn(), captureMessage: vi.fn() }))
vi.mock("@sentry/nextjs", () => sentry)

const fetchMock = vi.fn()
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const page = (results: unknown[], next_cursor: string | null = null) => json({ results, has_more: next_cursor !== null, next_cursor })

const loadModule = async () => {
  vi.resetModules()
  return await import("./fetch-opco-guide")
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock)
  vi.stubEnv("LBA_NOTION_API_TOKEN", "jeton-de-test")
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.useRealTimers()
  fetchMock.mockReset()
  sentry.captureException.mockReset()
  sentry.captureMessage.mockReset()
})

describe("createLimit", () => {
  it("ne laisse pas un nouvel appel prendre la place libérée avant celui qui attendait", async () => {
    const { createLimit } = await loadModule()
    const limit = createLimit(1)
    let active = 0
    let maxActive = 0
    const track = async () => {
      active++
      maxActive = Math.max(maxActive, active)
      await new Promise((resolve) => setTimeout(resolve, 1))
      active--
    }
    const gate: { release?: () => void } = {}
    const first = limit(
      () =>
        new Promise<void>((resolve) => {
          gate.release = resolve
        })
    )
    const queued = limit(track)
    let late: Promise<void> = Promise.resolve()

    gate.release?.()
    // Microtâche planifiée avant le réveil de `queued` : c'est la fenêtre où un appel pourrait doubler la file.
    queueMicrotask(() => {
      late = limit(track)
    })
    await first
    await queued
    await late

    expect(maxActive).toBe(1)
  })
})

describe("fetchOpcoGuide", () => {
  it("sans jeton, n'appelle pas Notion et le signale une seule fois", async () => {
    vi.stubEnv("LBA_NOTION_API_TOKEN", "")
    const { fetchOpcoGuide } = await loadModule()

    expect(await fetchOpcoGuide()).toEqual({ status: "unavailable" })
    expect(await fetchOpcoGuide()).toEqual({ status: "unavailable" })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(sentry.captureMessage).toHaveBeenCalledTimes(1)
  })

  it("suit la pagination et lit les enfants des blocs rendus, pas ceux des autres", async () => {
    const [firstHeading, ...rest] = sectionHeadings(7)
    const toggle = { ...block("toggle", { rich_text: [text("Question fictive")] }), has_children: true }
    const childPage = { ...block("child_page", { title: "Sous-page" }), has_children: true }
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes(`/blocks/${toggle.id}/`)) return page([block("paragraph", { rich_text: [text("Réponse fictive")] })])
      if (url.includes("start_cursor=suite")) return page([toggle, childPage, ...rest])
      return page([firstHeading], "suite")
    })
    const { fetchOpcoGuide } = await loadModule()

    const result = await fetchOpcoGuide()

    expect(result.status).toBe("ok")
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls.some(([url]) => url.includes(childPage.id))).toBe(false)
    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ Authorization: "Bearer jeton-de-test", "Notion-Version": "2026-03-11" })
    expect(sentry.captureMessage).toHaveBeenCalledWith("Guide de modération OPCO : blocs Notion non rendus", expect.objectContaining({ extra: { types: ["child_page"] } }))
  })

  it("lit les enfants en parallèle, 3 appels au plus en même temps", async () => {
    const toggles = Array.from({ length: 6 }, (_, index) => ({ ...block("toggle", { rich_text: [text(`Question fictive ${index}`)] }), has_children: true }))
    let inFlight = 0
    let maxInFlight = 0
    fetchMock.mockImplementation(async (url: string) => {
      inFlight++
      maxInFlight = Math.max(maxInFlight, inFlight)
      await new Promise((resolve) => setTimeout(resolve, 5))
      inFlight--
      if (toggles.some(({ id }) => url.includes(`/blocks/${id}/`))) return page([block("paragraph", { rich_text: [text("Réponse fictive")] })])
      return page([...sectionHeadings(7), ...toggles])
    })
    const { fetchOpcoGuide } = await loadModule()

    expect((await fetchOpcoGuide()).status).toBe("ok")
    expect(fetchMock).toHaveBeenCalledTimes(1 + toggles.length)
    expect(maxInFlight).toBe(3)
  })

  it("refuse une structure inattendue sans remonter le texte du guide", async () => {
    fetchMock.mockResolvedValue(page(sectionHeadings(6)))
    const { fetchOpcoGuide } = await loadModule()

    expect(await fetchOpcoGuide()).toEqual({ status: "unavailable" })
    const reported = sentry.captureException.mock.calls.map(([error, context]) => `${String(error)} ${JSON.stringify(context)}`).join("\n")
    expect(reported).toContain("structure Notion refusée")
    expect(reported).not.toContain("Texte fictif")
  })

  it("sert la dernière version connue quand Notion tombe après expiration du cache", async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    fetchMock.mockResolvedValue(page(sectionHeadings(7)))
    const { fetchOpcoGuide } = await loadModule()
    const first = await fetchOpcoGuide()

    vi.setSystemTime(Date.now() + 60 * 60 * 1_000)
    fetchMock.mockResolvedValue(json({}, 401))

    expect(await fetchOpcoGuide()).toEqual(first)
  })

  it("borne chaque appel par un délai, pour retomber sur le contenu de secours", async () => {
    fetchMock.mockResolvedValue(page(sectionHeadings(7)))
    const { fetchOpcoGuide } = await loadModule()

    await fetchOpcoGuide()

    expect(fetchMock.mock.calls.every(([, init]) => init.signal instanceof AbortSignal)).toBe(true)
  })

  it("ne réessaie pas une erreur d'autorisation", async () => {
    fetchMock.mockResolvedValue(json({ message: "Could not find block" }, 404))
    const { fetchOpcoGuide } = await loadModule()

    expect(await fetchOpcoGuide()).toEqual({ status: "unavailable" })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(sentry.captureException.mock.calls[0][0])).toContain("HTTP 404")
  })
})
