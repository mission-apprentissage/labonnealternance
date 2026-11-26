import { beforeEach, describe, expect, it, vi } from "vitest"

const matomo = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock("@/utils/matomo-utils", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/utils/matomo-utils")>()), pushMatomoEvent: matomo.push }))

const { createVideoPlayTracker } = await import("./OpcoGuideTracking")

beforeEach(() => matomo.push.mockReset())

describe("createVideoPlayTracker", () => {
  it("compte la première lecture seulement, pas les reprises après pause", () => {
    const onPlay = createVideoPlayTracker()

    onPlay()
    onPlay()

    expect(matomo.push).toHaveBeenCalledTimes(1)
    expect(matomo.push).toHaveBeenCalledWith({ event: "opco_guide_video_played" })
  })

  it("compte à nouveau sur un autre affichage de la page", () => {
    createVideoPlayTracker()()
    createVideoPlayTracker()()

    expect(matomo.push).toHaveBeenCalledTimes(2)
  })
})
