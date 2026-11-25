import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { describe, expect, it, vi } from "vitest"

const loggerMock = vi.hoisted(() => ({ trace: vi.fn(), debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), fatal: vi.fn() }))

vi.mock("@/common/logger", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/common/logger")>()), logger: loggerMock }))

const MOBILE_CHROME = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36"

const page = {
  page_id: "0123456789abcdef",
  landing_route: "/emploi/offres_emploi_lba/[id]",
  version: "1.952.0",
  viewport_width: 412,
  cpu_cores: 8,
  device_memory: 4,
  effective_type: "4g",
}

const inp = {
  metric: "INP",
  value: 288,
  rating: "needs-improvement",
  route: "/emploi/offres_emploi_lba/[id]",
  navigation_type: "navigate",
  load_state: "complete",
  target: "div.MuiBox-root>button.fr-btn",
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

const cls = { metric: "CLS", value: 0.31, rating: "poor", route: "/", navigation_type: "navigate", load_state: "complete", target: "main>footer", largest_shift_value: 0.28 }

const lcp = {
  metric: "LCP",
  value: 3120,
  rating: "poor",
  route: "/",
  navigation_type: "navigate",
  target: "main>img.hero",
  url: "https://labonnealternance.apprentissage.beta.gouv.fr/_next/image",
  time_to_first_byte: 640,
  resource_load_delay: 910,
  resource_load_duration: 1200,
  element_render_delay: 370,
}

const ttfb = {
  metric: "TTFB",
  value: 812,
  rating: "needs-improvement",
  route: "/",
  navigation_type: "navigate",
  waiting_duration: 12,
  cache_duration: 0,
  dns_duration: 30,
  connection_duration: 91,
  request_duration: 679,
}

const fcp = {
  metric: "FCP",
  value: 1821,
  rating: "needs-improvement",
  route: "/",
  navigation_type: "navigate",
  load_state: "dom-interactive",
  time_to_first_byte: 640,
  first_byte_to_fcp: 1180,
}

const batch = (...metrics: object[]) => ({ ...page, metrics })

const webVitalCalls = () => loggerMock.info.mock.calls.filter(([, message]) => message === "web-vital")
const rejectedCalls = () => loggerMock.warn.mock.calls.filter(([, message]) => message === "web-vital rejected")

describe("POST /_private/web-vitals", () => {
  useMongo()
  const httpClient = useServer()

  const post = (body: unknown, userAgent = MOBILE_CHROME) =>
    httpClient().inject({ method: "POST", path: "/api/_private/web-vitals", headers: { "user-agent": userAgent }, payload: body as object })

  it("journalise une ligne par métrique, avec le contexte de la page", async () => {
    const response = await post(batch(ttfb, fcp, lcp, inp, cls))

    expect(response.statusCode).toBe(200)
    expect(webVitalCalls()).toEqual([ttfb, fcp, lcp, inp, cls].map((metric) => [{ web_vital: { ...metric, ...page } }, "web-vital"]))
  })

  it("accepte un INP sans attribution Long Animation Frame (Safari, Firefox)", async () => {
    const { total_script_duration, total_style_and_layout_duration, longest_script_url, longest_script_invoker, longest_script_subpart, longest_script_duration, ...withoutLoaf } =
      inp

    const response = await post(batch(withoutLoaf))

    expect(response.statusCode).toBe(200)
    expect(webVitalCalls()).toHaveLength(1)
  })

  it("accepte un LCP textuel, sans ressource", async () => {
    const response = await post(batch({ ...lcp, url: null, resource_load_delay: 0, resource_load_duration: 0 }))

    expect(response.statusCode).toBe(200)
  })

  it("ignore les robots sans rien journaliser", async () => {
    const response = await post(batch(inp), "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")

    expect(response.statusCode).toBe(200)
    expect(webVitalCalls()).toHaveLength(0)
  })

  it("refuse un rapport au format d'une seule métrique, sans lot", async () => {
    const response = await post({ ...inp, ...page, page_id: undefined, landing_route: page.landing_route })

    expect(response.statusCode).toBe(400)
    expect(webVitalCalls()).toHaveLength(0)
  })

  it("refuse tout le lot quand une métrique est invalide, sans rien journaliser", async () => {
    const response = await post(batch(lcp, { ...inp, url: "/recherche?lat=48.85&lon=2.35" }))

    expect(response.statusCode).toBe(400)
    expect(webVitalCalls()).toHaveLength(0)
  })

  it.each([
    ["dans le lot", { ...batch(inp), referrer: "https://www.google.com/search?q=jean+dupont" }],
    ["dans une métrique", batch({ ...inp, url: "/recherche?lat=48.85&lon=2.35" })],
  ])("refuse un champ inconnu %s, qui pourrait faire entrer une donnée personnelle dans les logs", async (_case, body) => {
    const response = await post(body)

    expect(response.statusCode).toBe(400)
    expect(webVitalCalls()).toHaveLength(0)
  })

  it.each([
    ["URL de la ressource LCP avec query", batch({ ...lcp, url: "https://lba.fr/_next/image?url=%2Flogo%2F6a30155208d7f8e3d76cf05c.png" })],
    ["URL de la ressource LCP avec fragment", batch({ ...lcp, url: "https://lba.fr/hero.webp#uid=42" })],
    ["URL du script INP avec query", batch({ ...inp, longest_script_url: "https://stats.beta.gouv.fr/matomo.js?visitorId=abc" })],
  ])("refuse une URL qui garde sa query : %s", async (_case, body) => {
    const response = await post(body)

    expect(response.statusCode).toBe(400)
    expect(webVitalCalls()).toHaveLength(0)
  })

  it.each([
    ["page_id trop court", { ...batch(inp), page_id: "0123" }],
    ["page_id hors hexadécimal (identifiant réutilisé)", { ...batch(inp), page_id: "jean.dupont@exem" }],
    ["lot vide", batch()],
    ["plus de cinq métriques", batch(inp, cls, lcp, ttfb, fcp, inp)],
    ["champs propres à une autre métrique", batch({ ...inp, metric: "CLS" })],
    ["valeur hors bornes", batch({ ...lcp, value: 3_600_000 })],
    ["cible trop longue", batch({ ...inp, target: "a".repeat(301) })],
  ])("refuse le lot : %s", async (_case, body) => {
    const response = await post(body)

    expect(response.statusCode).toBe(400)
    expect(webVitalCalls()).toHaveLength(0)
  })

  it.each([
    ["chemin brut d'une fiche (ObjectId)", "/emploi/offres_emploi_lba/6a30155208d7f8e3d76cf05c/chauffeur"],
    ["SIRET en deuxième segment", "/espace-pro/12345678900012"],
    ["query string", "/recherche?lat=48.85&lon=2.35"],
    ["chemin trop profond", "/emploi/offres_emploi_lba/[id]/[slug]"],
  ])("refuse une route qui n'est pas un gabarit : %s", async (_case, route) => {
    const asRoute = await post(batch({ ...lcp, route }))
    const asLandingRoute = await post({ ...batch(lcp), landing_route: route })

    expect([asRoute.statusCode, asLandingRoute.statusCode]).toEqual([400, 400])
    expect(webVitalCalls()).toHaveLength(0)
  })

  it.each(["/", "/*", "/recherche", "/premium/*", "/espace-pro/administration/*", "/emploi/[type]/[id]"])("accepte le gabarit %s", async (route) => {
    const response = await post({ ...batch({ ...lcp, route }), landing_route: route })

    expect(response.statusCode).toBe(200)
  })

  it("journalise le chemin des champs refusés, sans leur valeur", async () => {
    const rawRoute = "/emploi/offres_emploi_lba/6a30155208d7f8e3d76cf05c/chauffeur"

    const response = await post(batch(lcp, { ...inp, route: rawRoute }))

    expect(response.statusCode).toBe(400)
    expect(rejectedCalls()).toEqual([[{ web_vital_rejected: ["/metrics/1/route invalid_format"] }, "web-vital rejected"]])
    expect(JSON.stringify(loggerMock.warn.mock.calls)).not.toContain("6a30155208d7f8e3d76cf05c")
  })

  it("ne journalise pas les refus des robots", async () => {
    const response = await post({ ...batch(inp), page_id: "x" }, "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")

    expect(response.statusCode).toBe(400)
    expect(rejectedCalls()).toHaveLength(0)
  })
})
