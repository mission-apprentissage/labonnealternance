import { ZWebVitalMetric, ZWebVitalsBatch, zWebVitalRoute } from "shared/routes/_private/web-vitals.routes"
import { describe, expect, it } from "vitest"
import type { CLSMetricWithAttribution, FCPMetricWithAttribution, INPMetricWithAttribution, LCPMetricWithAttribution, TTFBMetricWithAttribution } from "web-vitals/attribution"

import { buildBatch, buildClsMetric, buildFcpMetric, buildInpMetric, buildLcpMetric, buildTtfbMetric, toRouteTemplate } from "./web-vitals.utils"

describe("toRouteTemplate", () => {
  it.each([
    ["/", "/"],
    ["", "/"],
    ["/recherche", "/recherche"],
    ["/recherche/", "/recherche"],
    ["/emploi/offres_emploi_lba/6a30155208d7f8e3d76cf05c/chauffeur-chauffeuse-de-machines-agricoles", "/emploi/offres_emploi_lba/[id]"],
    ["/emploi/offres_emploi_partenaires/69d038a19a609ff079f69d86/electricien", "/emploi/offres_emploi_partenaires/[id]"],
    ["/emploi/recruteurs_lba/75330823803136/responsable-de-caisses", "/emploi/recruteurs_lba/[id]"],
    ["/formation/abc-123/bts-mco", "/formation/[id]"],
    ["/alternance/ville/paris", "/alternance/ville/[slug]"],
    ["/alternance/diplome/bts-gpme", "/alternance/diplome/[slug]"],
    ["/metiers/secretariat-medical", "/metiers/[slug]"],
    ["/espace-pro/authentification", "/espace-pro/authentification"],
  ])("%s → %s", (pathname, expected) => {
    expect(toRouteTemplate(pathname)).toBe(expected)
    // l'API n'accepte que des gabarits : chaque sortie doit passer sa validation
    expect(zWebVitalRoute.safeParse(expected).success).toBe(true)
  })

  // cas qui laisseraient passer un identifiant ou un texte libre si la règle était trop permissive
  it.each([
    ["type de fiche inconnu, saisi dans l'URL", "/emploi/jean.dupont@exemple.fr/123", "/emploi/[type]/[id]"],
    ["identifiant sans chiffre (ObjectId en a-f)", "/premium/abcdefabcdefabcdefabcdef", "/premium/*"],
    ["identifiant d'utilisateur dans l'espace pro", "/espace-pro/administration/users/6a30155208d7f8e3d76cf05c", "/espace-pro/administration/*"],
    ["SIRET en deuxième segment de l'espace pro", "/espace-pro/12345678900012", "/espace-pro/*"],
    ["sous-section alternance inconnue", "/alternance/jean-dupont/x", "/alternance/*"],
    ["premier segment avec majuscules ou caractères encodés", "/Jean%20Dupont", "/*"],
    ["premier segment trop long", `/${"a".repeat(61)}`, "/*"],
  ])("%s", (_case, pathname, expected) => {
    expect(toRouteTemplate(pathname)).toBe(expected)
    // l'API n'accepte que des gabarits : chaque sortie doit passer sa validation
    expect(zWebVitalRoute.safeParse(expected).success).toBe(true)
  })
})

const ROUTE = "/emploi/offres_emploi_lba/[id]"

const base = { rating: "needs-improvement", delta: 0, id: "v5-1", entries: [], navigationType: "navigate", navigationId: 1 } as const

const inpMetric = (attribution: Partial<INPMetricWithAttribution["attribution"]>) =>
  ({
    ...base,
    name: "INP",
    value: 288.4,
    attribution: {
      interactionTarget: "div.MuiBox-root>button.fr-btn",
      interactionType: "pointer",
      inputDelay: 12.2,
      processingDuration: 180.6,
      presentationDelay: 95.6,
      loadState: "complete",
      processedEventEntries: [],
      longAnimationFrameEntries: [],
      ...attribution,
    },
  }) as unknown as INPMetricWithAttribution

const lcpMetric = (attribution: Partial<LCPMetricWithAttribution["attribution"]>) =>
  ({
    ...base,
    name: "LCP",
    value: 3120.6,
    rating: "poor",
    attribution: {
      target: "main>img.hero",
      url: "https://labonnealternance.apprentissage.beta.gouv.fr/_next/image?url=%2Fimages%2Fhome.png&w=1080&q=75",
      timeToFirstByte: 640.2,
      resourceLoadDelay: 910.4,
      resourceLoadDuration: 1200.1,
      elementRenderDelay: 369.9,
      ...attribution,
    },
  }) as unknown as LCPMetricWithAttribution

describe("buildInpMetric", () => {
  it("construit une mesure acceptée par l'API, sans la query de l'URL du script", () => {
    const metric = buildInpMetric(
      inpMetric({
        totalScriptDuration: 170.2,
        totalStyleAndLayoutDuration: 60.4,
        longestScript: {
          entry: { sourceURL: "https://stats.beta.gouv.fr/matomo.js?visitorId=abc#x", invoker: "BUTTON.onclick" } as PerformanceScriptTiming,
          subpart: "processing-duration",
          intersectingDuration: 150.7,
        },
      }),
      ROUTE
    )

    expect(metric).toEqual({
      metric: "INP",
      value: 288,
      rating: "needs-improvement",
      route: ROUTE,
      navigation_type: "navigate",
      load_state: "complete",
      target: "div.MuiBox-root>button.fr-btn",
      interaction_type: "pointer",
      input_delay: 12,
      processing_duration: 181,
      presentation_delay: 96,
      total_script_duration: 170,
      total_style_and_layout_duration: 60,
      longest_script_url: "https://stats.beta.gouv.fr/matomo.js",
      longest_script_invoker: "BUTTON.onclick",
      longest_script_subpart: "processing-duration",
      longest_script_duration: 151,
    })
    expect(ZWebVitalMetric.parse(metric)).toEqual(metric)
  })

  it("reste accepté sans Long Animation Frame ni cible (Safari, élément retiré du DOM)", () => {
    const metric = buildInpMetric(inpMetric({ interactionTarget: "", interactionType: undefined }), ROUTE)

    expect(metric).toMatchObject({ target: null, interaction_type: null, longest_script_url: null, total_script_duration: null })
    expect(() => ZWebVitalMetric.parse(metric)).not.toThrow()
  })

  it.each([
    ["URL du script (classic-script)", "https://stats.beta.gouv.fr/matomo.js?visitorId=abc#x", "https://stats.beta.gouv.fr/matomo.js"],
    ["src d'un élément sans id (event-listener)", 'IMG[src="https://x.fr/p.gif?uid=42"].onload', 'IMG[src="https://x.fr/p.gif"].onload'],
    ["élément avec id, gardé intact", "BUTTON#postuler.onclick", "BUTTON#postuler.onclick"],
    ["callback sans URL", "TimerHandler:setTimeout", "TimerHandler:setTimeout"],
  ])("retire la query des URL de l'invoker : %s", (_case, invoker, expected) => {
    const metric = buildInpMetric(
      inpMetric({ longestScript: { entry: { sourceURL: "", invoker } as PerformanceScriptTiming, subpart: "processing-duration", intersectingDuration: 80 } }),
      ROUTE
    )

    expect(metric).toMatchObject({ longest_script_invoker: expected })
  })

  it("tronque une cible trop longue pour que l'API ne rejette pas le lot", () => {
    const metric = buildInpMetric(inpMetric({ interactionTarget: "div>".repeat(200) }), ROUTE)

    expect(metric).toMatchObject({ target: expect.any(String) })
    expect((metric as { target: string }).target).toHaveLength(300)
    expect(() => ZWebVitalMetric.parse(metric)).not.toThrow()
  })
})

describe("buildClsMetric", () => {
  it("construit une mesure acceptée par l'API", () => {
    const metric = buildClsMetric(
      {
        ...base,
        name: "CLS",
        value: 0.312345,
        rating: "poor",
        attribution: { largestShiftTarget: "main>footer", largestShiftValue: 0.28456, loadState: "dom-content-loaded" },
      } as unknown as CLSMetricWithAttribution,
      "/"
    )

    expect(metric).toMatchObject({ metric: "CLS", value: 0.3123, largest_shift_value: 0.2846, target: "main>footer", load_state: "dom-content-loaded", route: "/" })
    expect(ZWebVitalMetric.parse(metric)).toEqual(metric)
  })
})

describe("buildLcpMetric", () => {
  it("construit une mesure acceptée par l'API, avec le découpage du LCP", () => {
    const metric = buildLcpMetric(lcpMetric({}), "/")

    expect(metric).toEqual({
      metric: "LCP",
      value: 3121,
      rating: "poor",
      route: "/",
      navigation_type: "navigate",
      target: "main>img.hero",
      url: "https://labonnealternance.apprentissage.beta.gouv.fr/_next/image",
      time_to_first_byte: 640,
      resource_load_delay: 910,
      resource_load_duration: 1200,
      element_render_delay: 370,
    })
    expect(ZWebVitalMetric.parse(metric)).toEqual(metric)
  })

  it.each([
    ["image next/image", "https://lba.fr/_next/image?url=%2Flogo%2F6a30155208d7f8e3d76cf05c.png&w=64", "https://lba.fr/_next/image"],
    ["pixel avec identifiant de visite", "https://stats.beta.gouv.fr/p.gif?uid=42#x", "https://stats.beta.gouv.fr/p.gif"],
    ["fragment seul", "https://lba.fr/hero.webp#v2", "https://lba.fr/hero.webp"],
    ["image en data: URL", `data:image/png;base64,${"A".repeat(500)}`, "data:"],
  ])("retire la query et le fragment de l'URL de la ressource : %s", (_case, url, expected) => {
    const metric = buildLcpMetric(lcpMetric({ url }), "/")

    expect(metric).toMatchObject({ url: expected })
    expect(() => ZWebVitalMetric.parse(metric)).not.toThrow()
  })

  it("rapporte un LCP textuel sans ressource", () => {
    const metric = buildLcpMetric(lcpMetric({ url: undefined, resourceLoadDelay: 0, resourceLoadDuration: 0 }), "/")

    expect(metric).toMatchObject({ url: null, resource_load_delay: 0 })
    expect(() => ZWebVitalMetric.parse(metric)).not.toThrow()
  })

  it("borne une durée aberrante plutôt que de faire refuser tout le lot", () => {
    const metric = buildLcpMetric({ ...lcpMetric({ elementRenderDelay: 9_000_000 }), value: 9_000_000 }, "/")

    expect(metric).toMatchObject({ value: 600_000, element_render_delay: 600_000 })
    expect(() => ZWebVitalMetric.parse(metric)).not.toThrow()
  })
})

describe("buildTtfbMetric", () => {
  it("construit une mesure acceptée par l'API, avec le découpage du TTFB", () => {
    const metric = buildTtfbMetric(
      {
        ...base,
        name: "TTFB",
        value: 812.3,
        attribution: { waitingDuration: 12.1, cacheDuration: 0.4, dnsDuration: 30.2, connectionDuration: 90.6, requestDuration: 679 },
      } as unknown as TTFBMetricWithAttribution,
      ROUTE
    )

    expect(metric).toEqual({
      metric: "TTFB",
      value: 812,
      rating: "needs-improvement",
      route: ROUTE,
      navigation_type: "navigate",
      waiting_duration: 12,
      cache_duration: 0,
      dns_duration: 30,
      connection_duration: 91,
      request_duration: 679,
    })
    expect(ZWebVitalMetric.parse(metric)).toEqual(metric)
  })
})

describe("buildFcpMetric", () => {
  it("construit une mesure acceptée par l'API, avec le découpage du FCP", () => {
    const metric = buildFcpMetric(
      { ...base, name: "FCP", value: 1820.5, attribution: { timeToFirstByte: 640.2, firstByteToFCP: 1180.3, loadState: "dom-interactive" } } as unknown as FCPMetricWithAttribution,
      ROUTE
    )

    expect(metric).toEqual({
      metric: "FCP",
      value: 1821,
      rating: "needs-improvement",
      route: ROUTE,
      navigation_type: "navigate",
      load_state: "dom-interactive",
      time_to_first_byte: 640,
      first_byte_to_fcp: 1180,
    })
    expect(ZWebVitalMetric.parse(metric)).toEqual(metric)
  })
})

describe("buildBatch", () => {
  const page = {
    pageId: "0123456789abcdef",
    landingRoute: ROUTE,
    version: "1.952.0",
    viewportWidth: 412.5,
    cpuCores: 8,
    deviceMemory: 4,
    effectiveType: "4g",
  }

  it("regroupe les mesures d'une page dans un lot accepté par l'API", () => {
    const metrics = [buildInpMetric(inpMetric({}), ROUTE), buildLcpMetric(lcpMetric({}), ROUTE)]

    const batch = buildBatch(page, metrics)

    expect(batch).toEqual({
      page_id: "0123456789abcdef",
      landing_route: ROUTE,
      version: "1.952.0",
      viewport_width: 413,
      cpu_cores: 8,
      device_memory: 4,
      effective_type: "4g",
      metrics,
    })
    expect(ZWebVitalsBatch.parse(batch)).toEqual(batch)
  })

  it("reste accepté sans les informations d'appareil (Safari, Firefox)", () => {
    const batch = buildBatch({ ...page, cpuCores: undefined, deviceMemory: undefined, effectiveType: undefined }, [buildLcpMetric(lcpMetric({}), "/")])

    expect(batch).toMatchObject({ cpu_cores: null, device_memory: null, effective_type: null })
    expect(() => ZWebVitalsBatch.parse(batch)).not.toThrow()
  })
})
