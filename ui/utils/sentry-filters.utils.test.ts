import { describe, expect, it } from "vitest"

import { isHeadlessBrowserUserAgent, isStackOverflowOutsideBundle } from "./sentry-filters.utils"

describe("isHeadlessBrowserUserAgent", () => {
  it("détecte HeadlessChrome (Puppeteer / Playwright), y compris avec un marqueur en fin de chaîne", () => {
    expect(isHeadlessBrowserUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/148.0.7778.0 Safari/537.36")).toBe(true)
    expect(isHeadlessBrowserUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 HeadlessChrome")).toBe(
      true
    )
  })

  it("laisse passer les vrais navigateurs, même anciens ou figés (near-miss du scraper Chrome 126)", () => {
    expect(isHeadlessBrowserUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")).toBe(false)
    expect(isHeadlessBrowserUserAgent("Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36")).toBe(false)
    expect(
      isHeadlessBrowserUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1")
    ).toBe(false)
  })

  it("ne matche pas une mention voisine qui n'est pas le marqueur (headless en minuscules, Headless seul)", () => {
    expect(isHeadlessBrowserUserAgent("Mozilla/5.0 (X11; Linux x86_64) headless-shell/120.0 Chrome/120.0.0.0")).toBe(false)
    expect(isHeadlessBrowserUserAgent("Mozilla/5.0 Headless Firefox/154.0")).toBe(false)
  })

  it("renvoie faux sans user-agent", () => {
    expect(isHeadlessBrowserUserAgent(undefined)).toBe(false)
    expect(isHeadlessBrowserUserAgent(null)).toBe(false)
    expect(isHeadlessBrowserUserAgent("")).toBe(false)
  })
})

describe("isStackOverflowOutsideBundle", () => {
  const STACK_OVERFLOW = { type: "RangeError", value: "Maximum call stack size exceeded." }
  // Forme des frames relevée sur Chrome iOS : récursion en haut de pile, appelants en bas, tout
  // attribué au document.
  const injectedFrames = (document: string) => [
    { filename: `app:///${document}` },
    { filename: `app:///${document}` },
    { filename: "app:///recherche" },
    { filename: "app:///recherche" },
  ]

  it("filtre un débordement dont toutes les frames sont attribuées au document", () => {
    expect(isStackOverflowOutsideBundle({ ...STACK_OVERFLOW, stacktrace: { frames: injectedFrames("emploi/offres_emploi_partenaires/id/intitule") } })).toBe(true)
  })

  it("filtre un débordement dont la frame n'a pas de fichier", () => {
    expect(isStackOverflowOutsideBundle({ ...STACK_OVERFLOW, stacktrace: { frames: [{}] } })).toBe(true)
  })

  it("accepte le message V8, sans point final", () => {
    expect(isStackOverflowOutsideBundle({ type: "RangeError", value: "Maximum call stack size exceeded", stacktrace: { frames: injectedFrames("recherche") } })).toBe(true)
  })

  it("garde une récursion du code LBA, que l'URL du chunk soit réécrite ou non", () => {
    for (const filename of ["app:///_next/static/chunks/0a1b2c3d.js", "https://labonnealternance.apprentissage.beta.gouv.fr/_next/static/chunks/0a1b2c3d.js"]) {
      expect(isStackOverflowOutsideBundle({ ...STACK_OVERFLOW, stacktrace: { frames: [{ filename }, { filename }] } })).toBe(false)
    }
  })

  it("garde un débordement dès qu'une seule frame vient du build, même en bas de pile", () => {
    expect(
      isStackOverflowOutsideBundle({ ...STACK_OVERFLOW, stacktrace: { frames: [{ filename: "app:///_next/static/chunks/0a1b2c3d.js" }, ...injectedFrames("recherche")] } })
    ).toBe(false)
  })

  it("garde une autre erreur aux frames identiques : même message sous un autre type, ou autre RangeError", () => {
    const frames = injectedFrames("recherche")
    expect(isStackOverflowOutsideBundle({ type: "Error", value: "Maximum call stack size exceeded.", stacktrace: { frames } })).toBe(false)
    expect(isStackOverflowOutsideBundle({ type: "RangeError", value: "Invalid array length", stacktrace: { frames } })).toBe(false)
  })

  it("garde un débordement sans stacktrace : rien ne dit d'où il vient", () => {
    expect(isStackOverflowOutsideBundle(STACK_OVERFLOW)).toBe(false)
    expect(isStackOverflowOutsideBundle({ ...STACK_OVERFLOW, stacktrace: { frames: [] } })).toBe(false)
    expect(isStackOverflowOutsideBundle(undefined)).toBe(false)
  })
})
