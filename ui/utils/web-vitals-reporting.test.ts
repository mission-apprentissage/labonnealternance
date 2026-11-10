import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { CLSMetricWithAttribution, INPMetricWithAttribution } from "web-vitals/attribution"
import { onCLS, onINP } from "web-vitals/attribution"

import { publicConfig } from "@/config.public"
import { createRouteHistory } from "@/utils/route-history.utils"
import { startWebVitalsReporting } from "@/utils/web-vitals-reporting"

vi.mock("web-vitals/attribution", () => ({ onINP: vi.fn(), onCLS: vi.fn() }))

const FICHE = "/emploi/offres_emploi_lba/6a30155208d7f8e3d76cf05c/chauffeur"

const inpMetric = (interactionTime: number | undefined) =>
  ({
    name: "INP",
    value: 288,
    rating: "needs-improvement",
    navigationType: "navigate",
    attribution: {
      interactionTime,
      interactionTarget: "button.fr-btn",
      interactionType: "pointer",
      inputDelay: 10,
      processingDuration: 180,
      presentationDelay: 98,
      loadState: "complete",
    },
  }) as unknown as INPMetricWithAttribution

const clsMetric = (largestShiftTime: number | undefined) =>
  ({
    name: "CLS",
    value: 0.3,
    rating: "poor",
    navigationType: "navigate",
    attribution: { largestShiftTime, largestShiftTarget: "main>footer" },
  }) as unknown as CLSMetricWithAttribution

const sendBeacon = vi.fn()
const fetchMock = vi.fn()

beforeEach(() => {
  sendBeacon.mockReturnValue(true)
  fetchMock.mockResolvedValue(new Response("{}"))
  vi.stubGlobal("navigator", { sendBeacon, hardwareConcurrency: 8 })
  vi.stubGlobal("window", { location: { pathname: "/recherche" }, innerWidth: 412 })
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

const start = () => {
  const history = createRouteHistory()
  history.record("/", 100)
  history.record(FICHE, 500)
  startWebVitalsReporting({ landingPath: "/", history })
  return { reportInp: vi.mocked(onINP).mock.calls[0][0], reportCls: vi.mocked(onCLS).mock.calls[0][0] }
}

const sentBeacon = async () => {
  const [url, blob] = sendBeacon.mock.calls[0]
  return { url, body: JSON.parse(await (blob as Blob).text()) }
}

describe("startWebVitalsReporting", () => {
  it("s'abonne une seule fois à l'INP et au CLS", () => {
    start()

    expect(onINP).toHaveBeenCalledTimes(1)
    expect(onCLS).toHaveBeenCalledTimes(1)
  })

  it("rapporte l'INP à la route affichée au moment de l'interaction, pas à celle de l'envoi", async () => {
    const { reportInp } = start()

    reportInp(inpMetric(700))

    const { url, body } = await sentBeacon()
    expect(url).toBe(`${publicConfig.apiEndpoint}/_private/web-vitals`)
    expect(body).toMatchObject({ metric: "INP", landing_route: "/", route: "/emploi/offres_emploi_lba/[id]", viewport_width: 412, cpu_cores: 8 })
  })

  it("rapporte le CLS à la route affichée au moment du plus grand décalage", async () => {
    const { reportCls } = start()

    reportCls(clsMetric(300))

    expect((await sentBeacon()).body).toMatchObject({ metric: "CLS", route: "/" })
  })

  it("se rabat sur la page courante quand l'instant de l'interaction est inconnu", async () => {
    const { reportInp } = start()

    reportInp(inpMetric(undefined))

    expect((await sentBeacon()).body).toMatchObject({ route: "/recherche" })
  })

  it("repasse par fetch keepalive quand sendBeacon refuse l'envoi", async () => {
    sendBeacon.mockReturnValue(false)
    const { reportInp } = start()

    reportInp(inpMetric(700))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`${publicConfig.apiEndpoint}/_private/web-vitals`)
    expect(init).toMatchObject({ method: "POST", keepalive: true })
    expect(JSON.parse(init.body)).toMatchObject({ metric: "INP", route: "/emploi/offres_emploi_lba/[id]" })
  })

  it("n'appelle pas fetch quand sendBeacon a pris l'envoi en charge", () => {
    const { reportInp } = start()

    reportInp(inpMetric(700))

    expect(sendBeacon).toHaveBeenCalledTimes(1)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
