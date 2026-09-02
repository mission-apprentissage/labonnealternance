/**
 * Détecte un navigateur Chromium sans interface (Puppeteer, Playwright, scrapers…) via son
 * user-agent. Sentry ne le filtre pas : la regex « web crawlers » de Relay ne connaît pas
 * HeadlessChrome (vérifié le 2026-09-02 dans relay-filter/src/web_crawlers.rs).
 *
 * Volontairement limité au marqueur explicite « HeadlessChrome » : un Chrome figé sur une vieille
 * version (ex. « Chrome/126.0.0.0 ») est aussi typique d'un scraper, mais rien ne le distingue
 * d'un vrai utilisateur qui n'a pas mis à jour, donc on ne le filtre pas.
 */
export function isHeadlessBrowserUserAgent(userAgent: string | undefined | null): boolean {
  if (!userAgent) return false
  return userAgent.includes("HeadlessChrome")
}
