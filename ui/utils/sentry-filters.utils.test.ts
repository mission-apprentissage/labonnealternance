import { describe, expect, it } from "vitest"

import { isHeadlessBrowserUserAgent } from "./sentry-filters.utils"

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
