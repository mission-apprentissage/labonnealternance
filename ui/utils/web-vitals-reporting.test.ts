import { ZWebVitalsBatch } from "shared/routes/_private/web-vitals.routes"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { CLSMetricWithAttribution, FCPMetricWithAttribution, INPMetricWithAttribution, LCPMetricWithAttribution, TTFBMetricWithAttribution } from "web-vitals/attribution"
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals/attribution"

import { createRouteHistory } from "@/utils/route-history.utils"
import { startWebVitalsReporting } from "@/utils/web-vitals-reporting"

vi.mock("web-vitals/attribution", () => ({ onINP: vi.fn(), onCLS: vi.fn(), onLCP: vi.fn(), onFCP: vi.fn(), onTTFB: vi.fn() }))

const FICHE = "/emploi/offres_emploi_lba/6a30155208d7f8e3d76cf05c/chauffeur"

const inpMetric = (interactionTime: number | undefined, value = 288) =>
  ({
    name: "INP",
    value,
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

const lcpMetric = (value: number, navigationType = "navigate") =>
  ({
    name: "LCP",
    value,
    rating: "good",
    navigationType,
    attribution: {
      target: "main>h1",
      url: "https://lba.fr/_next/image?url=%2Fhero.png&w=640",
      timeToFirstByte: 300,
      resourceLoadDelay: 100,
      resourceLoadDuration: 200,
      elementRenderDelay: 50,
    },
  }) as unknown as LCPMetricWithAttribution

const fcpMetric = { name: "FCP", value: 900, rating: "good", navigationType: "navigate", attribution: { timeToFirstByte: 300, firstByteToFCP: 600, loadState: "dom-interactive" } }
const ttfbMetric = {
  name: "TTFB",
  value: 300,
  rating: "good",
  navigationType: "navigate",
  attribution: { waitingDuration: 5, cacheDuration: 0, dnsDuration: 20, connectionDuration: 40, requestDuration: 235 },
}

const sendBeacon = vi.fn()
const fetchMock = vi.fn()
let listeners: Map<string, (event: { persisted?: boolean }) => void>
const doc = { visibilityState: "visible" }

beforeEach(() => {
  listeners = new Map()
  doc.visibilityState = "visible"
  sendBeacon.mockReturnValue(true)
  fetchMock.mockResolvedValue(new Response("{}"))
  vi.stubGlobal("navigator", { sendBeacon, hardwareConcurrency: 8 })
  vi.stubGlobal("window", { location: { pathname: "/recherche" }, innerWidth: 412 })
  vi.stubGlobal("document", doc)
  vi.stubGlobal("addEventListener", (type: string, listener: (event: { persisted?: boolean }) => void) => listeners.set(type, listener))
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
  return {
    reportInp: vi.mocked(onINP).mock.calls[0][0],
    reportCls: vi.mocked(onCLS).mock.calls[0][0],
    reportLcp: vi.mocked(onLCP).mock.calls[0][0],
    reportFcp: vi.mocked(onFCP).mock.calls[0][0],
    reportTtfb: vi.mocked(onTTFB).mock.calls[0][0],
  }
}

const hide = () => {
  doc.visibilityState = "hidden"
  listeners.get("visibilitychange")?.({})
}

const sentBeacons = () => Promise.all(sendBeacon.mock.calls.map(async ([url, blob]) => ({ url, body: JSON.parse(await (blob as Blob).text()) })))

describe("startWebVitalsReporting", () => {
  it("s'abonne une seule fois à chaque métrique", () => {
    start()

    for (const on of [onINP, onCLS, onLCP, onFCP, onTTFB]) expect(on).toHaveBeenCalledTimes(1)
  })

  it("n'envoie rien tant que la page reste visible", () => {
    const { reportInp, reportLcp } = start()

    reportLcp(lcpMetric(1200))
    reportInp(inpMetric(700))

    expect(sendBeacon).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("envoie toutes les métriques de la page en un seul lot au passage en arrière-plan", async () => {
    const { reportInp, reportCls, reportLcp, reportFcp, reportTtfb } = start()
    reportTtfb(ttfbMetric as unknown as TTFBMetricWithAttribution)
    reportFcp(fcpMetric as unknown as FCPMetricWithAttribution)
    reportLcp(lcpMetric(1200))
    reportInp(inpMetric(700))
    reportCls(clsMetric(300))

    hide()

    const beacons = await sentBeacons()
    expect(beacons).toHaveLength(1)
    const [{ url, body }] = beacons
    expect(url).toBe("/bff/_private/web-vitals")
    expect(body).toMatchObject({ landing_route: "/", viewport_width: 412, cpu_cores: 8, page_id: expect.stringMatching(/^[0-9a-f]{16}$/) })
    expect(body.metrics.map(({ metric }: { metric: string }) => metric)).toEqual(["TTFB", "FCP", "LCP", "INP", "CLS"])
    expect(ZWebVitalsBatch.parse(body)).toEqual(body)
  })

  it("ne garde que la dernière valeur d'une métrique rapportée deux fois avant l'envoi", async () => {
    const { reportInp } = start()
    reportInp(inpMetric(700, 120))
    reportInp(inpMetric(700, 288))

    hide()

    const [{ body }] = await sentBeacons()
    expect(body.metrics).toEqual([expect.objectContaining({ metric: "INP", value: 288 })])
  })

  it("n'envoie au passage suivant que les métriques rapportées depuis, sous le même page_id", async () => {
    const { reportInp, reportLcp } = start()
    reportLcp(lcpMetric(1200))
    reportInp(inpMetric(700, 120))
    hide()
    reportInp(inpMetric(700, 288))

    hide()

    const [first, second] = await sentBeacons()
    expect(second.body.metrics).toEqual([expect.objectContaining({ metric: "INP", value: 288 })])
    expect(second.body.page_id).toBe(first.body.page_id)
  })

  it("n'envoie pas de lot vide", () => {
    start()

    hide()

    expect(sendBeacon).not.toHaveBeenCalled()
  })

  it("attend visibilitychange quand Chrome déclenche pagehide d'abord, pour ne pas couper le lot", async () => {
    const { reportInp, reportLcp } = start()
    reportLcp(lcpMetric(1200))

    listeners.get("pagehide")?.({ persisted: false })
    // web-vitals ne finalise l'INP qu'au passage à hidden
    reportInp(inpMetric(700))
    hide()

    const beacons = await sentBeacons()
    expect(beacons).toHaveLength(1)
    expect(beacons[0].body.metrics.map(({ metric }: { metric: string }) => metric)).toEqual(["LCP", "INP"])
  })

  it("change de page_id après une restauration depuis le bfcache, pas sur un simple pageshow", async () => {
    const { reportInp } = start()
    reportInp(inpMetric(700, 120))
    hide()
    listeners.get("pageshow")?.({ persisted: false })
    reportInp(inpMetric(700, 150))
    hide()
    listeners.get("pageshow")?.({ persisted: true })
    reportInp(inpMetric(undefined, 200))

    hide()

    const [first, second, third] = await sentBeacons()
    expect(second.body.page_id).toBe(first.body.page_id)
    expect(third.body.page_id).not.toBe(first.body.page_id)
  })

  it("rapporte l'INP à la route affichée au moment de l'interaction, pas à celle de l'envoi", async () => {
    const { reportInp } = start()
    reportInp(inpMetric(700))

    hide()

    const [{ body }] = await sentBeacons()
    expect(body.metrics[0]).toMatchObject({ metric: "INP", route: "/emploi/offres_emploi_lba/[id]" })
  })

  it("rapporte le CLS à la route affichée au moment du plus grand décalage", async () => {
    const { reportCls } = start()
    reportCls(clsMetric(300))

    hide()

    expect((await sentBeacons())[0].body.metrics[0]).toMatchObject({ metric: "CLS", route: "/" })
  })

  it("rapporte le LCP à la route affichée à l'instant du LCP", async () => {
    const { reportLcp } = start()
    reportLcp(lcpMetric(300))

    hide()

    expect((await sentBeacons())[0].body.metrics[0]).toMatchObject({ metric: "LCP", route: "/", url: "https://lba.fr/_next/image" })
  })

  it("rapporte un LCP après restauration bfcache à la page courante", async () => {
    const { reportLcp } = start()
    reportLcp(lcpMetric(300, "back-forward-cache"))

    hide()

    expect((await sentBeacons())[0].body.metrics[0]).toMatchObject({ metric: "LCP", route: "/recherche" })
  })

  it("se rabat sur la page courante quand l'instant de l'interaction est inconnu", async () => {
    const { reportInp } = start()
    reportInp(inpMetric(undefined))

    hide()

    expect((await sentBeacons())[0].body.metrics[0]).toMatchObject({ route: "/recherche" })
  })

  it("repasse par fetch keepalive quand sendBeacon refuse l'envoi", () => {
    sendBeacon.mockReturnValue(false)
    const { reportInp } = start()
    reportInp(inpMetric(700))

    hide()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("/bff/_private/web-vitals")
    expect(init).toMatchObject({ method: "POST", keepalive: true })
    expect(JSON.parse(init.body).metrics[0]).toMatchObject({ metric: "INP", route: "/emploi/offres_emploi_lba/[id]" })
  })

  it("n'appelle pas fetch quand sendBeacon a pris l'envoi en charge", () => {
    const { reportInp } = start()
    reportInp(inpMetric(700))

    hide()

    expect(sendBeacon).toHaveBeenCalledTimes(1)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
