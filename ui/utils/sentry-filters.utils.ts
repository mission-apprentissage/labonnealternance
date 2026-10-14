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

type ExceptionLike = { type?: string; value?: string; stacktrace?: { frames?: { filename?: string }[] } }

/**
 * Débordement de pile levé hors du build LBA : aucune frame sous `/_next/`, seulement des frames
 * attribuées au document (`app:///recherche`) ou sans fichier. Sur les issues examinées le
 * 2026-09-28 : iOS uniquement, Chrome iOS et app Google, traduction de page active (requêtes
 * gstatic `translate_http`, clics sur `<font>`). Sentry LBA-UI-1DH (4 391 events depuis novembre
 * 2025), puis plus de 100 issues depuis le 13/09/2026, une par page et par ligne (ex.
 * LBA-UI-5CVZZZZZZG5NB).
 *
 * Une récursion infinie du code LBA garde ses frames `/_next/` en haut de pile : elle reste remontée.
 */
export function isStackOverflowOutsideBundle(exception: ExceptionLike | undefined): boolean {
  if (exception?.type !== "RangeError" || !exception.value?.startsWith("Maximum call stack size exceeded")) return false
  const frames = exception.stacktrace?.frames ?? []
  return frames.length > 0 && frames.every((frame) => !frame.filename?.includes("/_next/"))
}
