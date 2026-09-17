import { publicConfig } from "@/config.public"

/** Changement de contexte à annoncer dans le nom accessible du lien (RGAA 6.1). */
export type ContextChange = "window" | "mail" | null

export const CONTEXT_CHANGE_HINT = {
  window: " - nouvelle fenêtre",
  mail: " - ouvre votre messagerie",
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
 * RGAA 6.1 : tout lien portant target="_blank" doit annoncer son changement de contexte.
 * La valeur retournée est donc calée sur `isExternal`, qui décide aussi du target.
 */
export function resolveContextChange(href: unknown, external: "auto" | boolean): ContextChange {
  if (!isExternalHref(href, external)) return null
  if (typeof href !== "string") return "window"
  return new URL(href, publicConfig.baseUrl).protocol === "mailto:" ? "mail" : "window"
}
