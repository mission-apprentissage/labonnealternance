import { publicConfig } from "@/config.public"

/** Changement de contexte à annoncer dans le nom accessible du lien (RGAA 6.1). */
export type ContextChange = "window" | "mail" | "download" | null

export const CONTEXT_CHANGE_HINT = {
  window: " - nouvelle fenêtre",
  mail: " - ouvre votre messagerie",
  download: " - téléchargement",
} as const satisfies Record<Exclude<ContextChange, null>, string>

/**
 * Un lien est externe s'il quitte le domaine, ou si l'appelant le force via la prop `external`.
 * Les mailto: sont externes ; les tel: et autres protocoles ne le sont pas.
 */
export function isExternalHref(href: unknown, external: "auto" | boolean): boolean {
  if (typeof external === "boolean") return external
  if (typeof href !== "string") return false
  const url = new URL(href, publicConfig.baseUrl)
  if (url.protocol === "mailto:") return true
  if (url.protocol !== "http:" && url.protocol !== "https:") return false
  return url.hostname !== publicConfig.host
}

/**
 * L'attribut `download` n'est honoré que sur une ressource de même origine. Ailleurs le navigateur
 * l'ignore : le fichier s'ouvre, et c'est un changement de fenêtre qu'il faut annoncer, pas un
 * téléchargement.
 */
export function isHonoredDownload(href: unknown, download: boolean | string | undefined): boolean {
  if (download === undefined || download === false) return false
  return !isExternalHref(href, "auto")
}

/**
 * RGAA 6.1 : tout lien qui change le contexte doit l'annoncer dans son nom accessible.
 * La valeur retournée est calée sur ce que le navigateur fait réellement : un téléchargement
 * effectif n'ouvre pas de fenêtre, il ne doit donc pas en annoncer une.
 */
export function resolveContextChange(href: unknown, external: "auto" | boolean, download?: boolean | string): ContextChange {
  if (isHonoredDownload(href, download)) return "download"
  if (!isExternalHref(href, external)) return null
  if (typeof href !== "string") return "window"
  return new URL(href, publicConfig.baseUrl).protocol === "mailto:" ? "mail" : "window"
}
