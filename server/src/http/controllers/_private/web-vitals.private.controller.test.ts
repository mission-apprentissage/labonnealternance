import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { describe, expect, it, vi } from "vitest"

const loggerMock = vi.hoisted(() => ({ trace: vi.fn(), debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), fatal: vi.fn() }))

vi.mock("@/common/logger", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/common/logger")>()), logger: loggerMock }))

const MOBILE_CHROME = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36"

const context = {
  rating: "needs-improvement",
  landing_route: "/emploi/offres_emploi_lba/[id]",
  route: "/emploi/offres_emploi_lba/[id]",
  version: "1.952.0",
  navigation_type: "navigate",
  load_state: "complete",
  target: "div.MuiBox-root>button.fr-btn",
  viewport_width: 412,
  cpu_cores: 8,
  device_memory: 4,
  effective_type: "4g",
}

const inp = {
  metric: "INP",
  value: 288,
  ...context,
  interaction_type: "pointer",
  input_delay: 12,
  processing_duration: 180,
  presentation_delay: 96,
  total_script_duration: 170,
  total_style_and_layout_duration: 60,
  longest_script_url: "https://labonnealternance.apprentissage.beta.gouv.fr/_next/static/chunks/abc.js",
  longest_script_invoker: "BUTTON.onclick",
  longest_script_subpart: "processing-duration",
  longest_script_duration: 150,
}

const webVitalCalls = () => loggerMock.info.mock.calls.filter(([, message]) => message === "web-vital")

describe("POST /_private/web-vitals", () => {
  useMongo()
  const httpClient = useServer()

  const post = (body: unknown, userAgent = MOBILE_CHROME) =>
    httpClient().inject({ method: "POST", path: "/api/_private/web-vitals", headers: { "user-agent": userAgent }, payload: body as object })

  it("journalise un rapport INP complet", async () => {
    const response = await post(inp)

    expect(response.statusCode).toBe(200)
    expect(webVitalCalls()).toEqual([[{ web_vital: inp }, "web-vital"]])
  })

  it("journalise un rapport CLS", async () => {
    const cls = { metric: "CLS", value: 0.31, ...context, largest_shift_value: 0.28 }

    const response = await post(cls)

    expect(response.statusCode).toBe(200)
    expect(webVitalCalls()).toEqual([[{ web_vital: cls }, "web-vital"]])
  })

  it("accepte un INP sans attribution Long Animation Frame (Safari, Firefox)", async () => {
    const { total_script_duration, total_style_and_layout_duration, longest_script_url, longest_script_invoker, longest_script_subpart, longest_script_duration, ...withoutLoaf } =
      inp

    const response = await post(withoutLoaf)

    expect(response.statusCode).toBe(200)
    expect(webVitalCalls()).toHaveLength(1)
  })

  it("ignore les robots sans rien journaliser", async () => {
    const response = await post(inp, "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")

    expect(response.statusCode).toBe(200)
    expect(webVitalCalls()).toHaveLength(0)
  })

  it("refuse un champ inconnu, qui pourrait faire entrer une donnée personnelle dans les logs", async () => {
    const response = await post({ ...inp, url: "/recherche?lat=48.85&lon=2.35" })

    expect(response.statusCode).toBe(400)
    expect(webVitalCalls()).toHaveLength(0)
  })

  it("refuse les champs propres à une autre métrique", async () => {
    const response = await post({ ...inp, metric: "CLS" })

    expect(response.statusCode).toBe(400)
  })

  it("refuse une valeur hors bornes", async () => {
    const response = await post({ ...inp, value: 3_600_000 })

    expect(response.statusCode).toBe(400)
  })

  it("refuse une cible trop longue", async () => {
    const response = await post({ ...inp, target: "a".repeat(301) })

    expect(response.statusCode).toBe(400)
  })

  it.each([
    ["chemin brut d'une fiche (ObjectId)", "/emploi/offres_emploi_lba/6a30155208d7f8e3d76cf05c/chauffeur"],
    ["SIRET en deuxième segment", "/espace-pro/12345678900012"],
    ["query string", "/recherche?lat=48.85&lon=2.35"],
    ["chemin trop profond", "/emploi/offres_emploi_lba/[id]/[slug]"],
  ])("refuse une route qui n'est pas un gabarit : %s", async (_case, route) => {
    const asRoute = await post({ ...inp, route })
    const asLandingRoute = await post({ ...inp, landing_route: route })

    expect([asRoute.statusCode, asLandingRoute.statusCode]).toEqual([400, 400])
    expect(webVitalCalls()).toHaveLength(0)
  })

  it.each(["/", "/*", "/recherche", "/premium/*", "/espace-pro/administration/*", "/emploi/[type]/[id]"])("accepte le gabarit %s", async (route) => {
    const response = await post({ ...inp, route, landing_route: route })

    expect(response.statusCode).toBe(200)
  })
})
