import type { IFeedbackPageContext } from "shared/models/feedback-display.model"
import type { IFeedbackFormPublic } from "shared/models/feedback-form.model"
import type { IFeedbackUrlParams } from "shared/utils/feedback-url-params"
import { sanitizeFeedbackUrlParams } from "shared/utils/feedback-url-params"
import { extractScopeParams, matchesScope } from "shared/utils/ui-routes.utils"

const FEEDBACK_DISMISS_DAYS = 30

type IStorage = Pick<Storage, "getItem" | "setItem">

/** Stockage du navigateur, ou `null` s'il est indisponible (navigation privée, cookies bloqués) : rien ne doit planter. */
function getBrowserStorage(kind: "localStorage" | "sessionStorage"): IStorage | null {
  try {
    return window[kind]
  } catch {
    return null
  }
}

function readJson<T>(storage: IStorage | null, key: string): T | null {
  try {
    const raw = storage?.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeJson(storage: IStorage | null, key: string, value: unknown): void {
  try {
    storage?.setItem(key, JSON.stringify(value))
  } catch {
    // quota dépassé ou stockage refusé : le widget sera simplement reproposé
  }
}

/** Ce que le navigateur retient d'un formulaire, d'une visite à l'autre. */
export type IFeedbackMemory = { dismissedAt?: string; completedAt?: string }

const memoryKey = (slug: string) => `lba-feedback:${slug}`
const countKey = (slug: string) => `lba-feedback-count:${slug}`
const announcedKey = (slug: string) => `lba-feedback-announced:${slug}`
const ENGAGED_KEY = "lba-feedback-engaged"

export const readFeedbackMemory = (slug: string, storage = getBrowserStorage("localStorage")): IFeedbackMemory => readJson<IFeedbackMemory>(storage, memoryKey(slug)) ?? {}

export function rememberFeedbackDismissed(slug: string, now = new Date(), storage = getBrowserStorage("localStorage")): void {
  writeJson(storage, memoryKey(slug), { ...readFeedbackMemory(slug, storage), dismissedAt: now.toISOString() })
}

export function rememberFeedbackCompleted(slug: string, now = new Date(), storage = getBrowserStorage("localStorage")): void {
  writeJson(storage, memoryKey(slug), { ...readFeedbackMemory(slug, storage), completedAt: now.toISOString() })
}

/** Répondu : plus jamais reproposé pour ce slug. Écarté : pas avant 30 jours. */
export function isFeedbackSuppressed(memory: IFeedbackMemory, now = new Date()): boolean {
  if (memory.completedAt) return true
  if (!memory.dismissedAt) return false
  const elapsedDays = (now.getTime() - new Date(memory.dismissedAt).getTime()) / 86_400_000
  return elapsedDays < FEEDBACK_DISMISS_DAYS
}

/** Interactions comptées pour un formulaire, cumulées sur la session et sur toutes ses pages de déclenchement. */
export const readInteractionCount = (slug: string, storage = getBrowserStorage("sessionStorage")): number => readJson<number>(storage, countKey(slug)) ?? 0

export function incrementInteractionCount(slug: string, storage = getBrowserStorage("sessionStorage")): number {
  const next = readInteractionCount(slug, storage) + 1
  writeJson(storage, countKey(slug), next)
  return next
}

/** Une interaction a déjà eu lieu dans la session : au rechargement, on récupère les formulaires sans attendre la suivante. */
export const hasEngaged = (storage = getBrowserStorage("sessionStorage")): boolean => readJson<boolean>(storage, ENGAGED_KEY) === true
export const markEngaged = (storage = getBrowserStorage("sessionStorage")): void => writeJson(storage, ENGAGED_KEY, true)

/** L'apparition du bouton n'est annoncée qu'une fois par session : la répéter à chaque page deviendrait du bruit. */
export function takeAnnouncement(slug: string, storage = getBrowserStorage("sessionStorage")): boolean {
  if (readJson<boolean>(storage, announcedKey(slug))) return false
  writeJson(storage, announcedKey(slug), true)
  return true
}

/** Le formulaire actif de la page courante. Au plus un : l'activation refuse deux formulaires sur une même page. */
export const findFeedbackFormForPath = (forms: IFeedbackFormPublic[], pathname: string): IFeedbackFormPublic | null =>
  forms.find((form) => form.trigger.scope.some((pattern) => matchesScope(pattern, pathname))) ?? null

/** Paramètres d'URL en objet : une clé répétée (`?romes=a&romes=b`) devient un tableau. */
export function toUrlParams(search: URLSearchParams): IFeedbackUrlParams {
  const params: IFeedbackUrlParams = {}
  for (const key of new Set(search.keys())) {
    const values = search.getAll(key)
    params[key] = values.length > 1 ? values : values[0]
  }
  return params
}

/**
 * Contexte envoyé avec un affichage : le motif de déclenchement qui couvre la page, les valeurs de
 * ses segments et les paramètres d'URL. Déjà filtré ici pour que rien d'identifiant ne quitte le
 * navigateur ; le serveur refiltre de toute façon.
 */
export function getFeedbackPageContext(form: IFeedbackFormPublic, pathname: string, search: URLSearchParams): IFeedbackPageContext | null {
  const page = form.trigger.scope.find((pattern) => matchesScope(pattern, pathname))
  if (!page) return null
  return {
    page,
    path_params: sanitizeFeedbackUrlParams(extractScopeParams(page, pathname) ?? {}) as Record<string, string>,
    query: sanitizeFeedbackUrlParams(toUrlParams(search)),
  }
}

const INTERACTIVE = "a[href], button, input, select, textarea, summary, [role='button'], [role='link'], [role='tab'], [role='checkbox'], [role='option']"
// en-tête, pied de page et bandeau de consentement ne disent rien de l'usage de la page ; le widget lui-même non plus
const EXCLUDED = "header, footer, .fr-consent-banner, [data-feedback-launcher]"

/**
 * Le clic compte-t-il comme une interaction réelle avec la page ? Oui s'il porte sur un élément
 * interactif du contenu. Typé au plus juste (`closest`) pour se tester sans DOM.
 */
export function isFeedbackInteraction(target: { closest(selector: string): unknown } | null): boolean {
  if (!target || typeof target.closest !== "function") return false
  return Boolean(target.closest(INTERACTIVE)) && !target.closest(EXCLUDED)
}
