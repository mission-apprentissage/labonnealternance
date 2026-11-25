import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
const mocks = vi.hoisted(() => ({ getSession: vi.fn(), fetchOpcoGuide: vi.fn() }))
vi.mock("@/utils/get-session", () => ({ getSession: mocks.getSession }))
vi.mock("./_lib/fetch-opco-guide", () => ({ fetchOpcoGuide: mocks.fetchOpcoGuide }))

const { default: GuideModerationOpcoPage, metadata } = await import("./page")

beforeEach(() => {
  mocks.getSession.mockReset()
  mocks.fetchOpcoGuide.mockReset().mockResolvedValue({ status: "unavailable" })
})

describe("page Guide de modération OPCO", () => {
  it("n'est pas indexée", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
  })

  it("lit le contenu Notion pour un utilisateur OPCO", async () => {
    mocks.getSession.mockResolvedValue({ user: { type: "OPCO" } })

    await GuideModerationOpcoPage()

    expect(mocks.fetchOpcoGuide).toHaveBeenCalledTimes(1)
  })

  it.each([["ADMIN"], ["ENTREPRISE"], ["CFA"]])("ne lit pas le contenu pour un utilisateur %s, même si le proxy le laissait passer", async (type) => {
    mocks.getSession.mockResolvedValue({ user: { type } })

    await GuideModerationOpcoPage()

    expect(mocks.fetchOpcoGuide).not.toHaveBeenCalled()
  })

  it("ne lit pas le contenu sans session", async () => {
    mocks.getSession.mockResolvedValue({})

    await GuideModerationOpcoPage()

    expect(mocks.fetchOpcoGuide).not.toHaveBeenCalled()
  })
})
