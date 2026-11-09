import { ZWebVitalReport, zWebVitalRoute } from "shared/routes/_private/web-vitals.routes"
import { describe, expect, it } from "vitest"
import type { CLSMetricWithAttribution, INPMetricWithAttribution } from "web-vitals/attribution"

import { buildClsReport, buildInpReport, type IWebVitalContext, toRouteTemplate } from "./web-vitals.utils"

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

const context: IWebVitalContext = {
  landingRoute: "/emploi/offres_emploi_lba/[id]",
  route: "/emploi/offres_emploi_lba/[id]",
  version: "1.952.0",
  viewportWidth: 412.5,
  cpuCores: 8,
  deviceMemory: 4,
  effectiveType: "4g",
}

const inpMetric = (attribution: Partial<INPMetricWithAttribution["attribution"]>) =>
  ({
    name: "INP",
    value: 288.4,
    rating: "needs-improvement",
    delta: 288.4,
    id: "v5-1",
    entries: [],
    navigationType: "navigate",
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
  }) as INPMetricWithAttribution

describe("buildInpReport", () => {
  it("construit un rapport accepté par l'API, sans la query de l'URL du script", () => {
    const report = buildInpReport(
      inpMetric({
        totalScriptDuration: 170.2,
        totalStyleAndLayoutDuration: 60.4,
        longestScript: {
          entry: { sourceURL: "https://stats.beta.gouv.fr/matomo.js?visitorId=abc#x", invoker: "BUTTON.onclick" } as PerformanceScriptTiming,
          subpart: "processing-duration",
          intersectingDuration: 150.7,
        },
      }),
      context
    )

    expect(report).toEqual({
      metric: "INP",
      value: 288,
      rating: "needs-improvement",
      navigation_type: "navigate",
      load_state: "complete",
      target: "div.MuiBox-root>button.fr-btn",
      landing_route: "/emploi/offres_emploi_lba/[id]",
      route: "/emploi/offres_emploi_lba/[id]",
      version: "1.952.0",
      viewport_width: 413,
      cpu_cores: 8,
      device_memory: 4,
      effective_type: "4g",
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
    expect(ZWebVitalReport.parse(report)).toEqual(report)
  })

  it("reste accepté sans Long Animation Frame ni cible (Safari, élément retiré du DOM)", () => {
    const report = buildInpReport(inpMetric({ interactionTarget: "", interactionType: undefined }), {
      ...context,
      cpuCores: undefined,
      deviceMemory: undefined,
      effectiveType: undefined,
    })

    expect(report).toMatchObject({ target: null, interaction_type: null, longest_script_url: null, total_script_duration: null, cpu_cores: null, device_memory: null })
    expect(() => ZWebVitalReport.parse(report)).not.toThrow()
  })

  it.each([
    ["URL du script (classic-script)", "https://stats.beta.gouv.fr/matomo.js?visitorId=abc#x", "https://stats.beta.gouv.fr/matomo.js"],
    ["src d'un élément sans id (event-listener)", 'IMG[src="https://x.fr/p.gif?uid=42"].onload', 'IMG[src="https://x.fr/p.gif"].onload'],
    ["élément avec id, gardé intact", "BUTTON#postuler.onclick", "BUTTON#postuler.onclick"],
    ["callback sans URL", "TimerHandler:setTimeout", "TimerHandler:setTimeout"],
  ])("retire la query des URL de l'invoker : %s", (_case, invoker, expected) => {
    const report = buildInpReport(
      inpMetric({ longestScript: { entry: { sourceURL: "", invoker } as PerformanceScriptTiming, subpart: "processing-duration", intersectingDuration: 80 } }),
      context
    )

    expect(report).toMatchObject({ longest_script_invoker: expected })
  })

  it("tronque une cible trop longue pour que l'API ne rejette pas le rapport", () => {
    const report = buildInpReport(inpMetric({ interactionTarget: "div>".repeat(200) }), context)

    expect(report.target).toHaveLength(300)
    expect(() => ZWebVitalReport.parse(report)).not.toThrow()
  })
})

describe("buildClsReport", () => {
  it("construit un rapport accepté par l'API", () => {
    const metric = {
      name: "CLS",
      value: 0.312345,
      rating: "poor",
      delta: 0.312345,
      id: "v5-2",
      entries: [],
      navigationType: "navigate",
      attribution: { largestShiftTarget: "main>footer", largestShiftValue: 0.28456, loadState: "dom-content-loaded" },
    } as unknown as CLSMetricWithAttribution

    const report = buildClsReport(metric, context)

    expect(report).toMatchObject({ metric: "CLS", value: 0.3123, largest_shift_value: 0.2846, target: "main>footer", load_state: "dom-content-loaded" })
    expect(ZWebVitalReport.parse(report)).toEqual(report)
  })
})
