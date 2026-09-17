import { captureException } from "@sentry/nextjs"
import { cacheLife } from "next/cache"
import { NotionAPI } from "notion-client"
import type { ExtendedRecordMap } from "notion-types"

// https://github.com/NotionX/react-notion-x/issues/710
// NOTION_API_BASE_URL sert à pointer sur un bouchon local pour rejouer les 429 (voir AGENTS.md).
// La variable reste honorée en production : le bug ne se reproduit que sur un build de prod, donc
// la procédure de reproduction tourne avec NODE_ENV=production.
const notion = new NotionAPI({ apiBaseUrl: process.env.NOTION_API_BASE_URL ?? "https://app.notion.com/api/v3" })

// `cacheLife("days")` ci-dessous ne suffit pas : `cacheMaxMemorySize: 0` (next.config.mjs) rend le
// cache handler "use cache" no-op en production, donc chaque requête retapait l'API Notion non
// officielle → 429 en rafale (issue Sentry LBA-UI-5CVZZZZZZG4TR). Ce cache process-level est
// indépendant du cache handler Next et sert aussi de dernier rempart (stale-if-error).
const TTL_MS = 24 * 60 * 60 * 1_000
// Au-delà, on préfère propager l'erreur : une panne Notion qui dure doit finir par se voir.
const MAX_STALE_MS = 7 * 24 * 60 * 60 * 1_000
// Sans ce palier, chaque requête entrante relancerait un cycle complet de tentatives et
// amplifierait le rate-limit qu'on cherche justement à éteindre.
const FAILURE_COOLDOWN_MS = 60 * 1_000
const MAX_CACHED_PAGES = 20
const RETRY_DELAYS_MS = [500, 1_500, 4_000]

type CacheEntry = { recordMap: ExtendedRecordMap; fetchedAt: number }
type HttpLikeError = { response?: { status?: number }; statusCode?: number; status?: number; message?: string }

const lastKnownGood = new Map<string, CacheEntry>()
const inFlight = new Map<string, Promise<ExtendedRecordMap>>()
const lastFailure = new Map<string, number>()

const isRetryableError = (error: unknown): boolean => {
  const { response, statusCode, status, message = "" } = (error ?? {}) as HttpLikeError
  const httpStatus = response?.status ?? statusCode ?? status

  if (typeof httpStatus === "number") {
    return httpStatus === 429 || httpStatus >= 500
  }
  // Pas de réponse HTTP exploitable : soit ofetch a sérialisé le code dans le message
  // (`[POST] "…/loadPageChunk": 429`), soit la requête n'a jamais abouti (panne réseau
  // transitoire, qu'ofetch rend par `<no response>`). Les deux méritent une nouvelle tentative.
  return /": (429|5\d\d)\b/.test(message) || /<no response>|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|aborted/i.test(message)
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const rememberPage = (pageId: string, recordMap: ExtendedRecordMap) => {
  // Réinsertion en fin de Map : l'ordre d'insertion sert d'ordre d'éviction.
  lastKnownGood.delete(pageId)
  lastKnownGood.set(pageId, { recordMap, fetchedAt: Date.now() })

  while (lastKnownGood.size > MAX_CACHED_PAGES) {
    const oldest = lastKnownGood.keys().next().value
    if (oldest === undefined) break
    lastKnownGood.delete(oldest)
  }
}

const isInCooldown = (pageId: string): boolean => {
  const failedAt = lastFailure.get(pageId)
  return failedAt !== undefined && Date.now() - failedAt < FAILURE_COOLDOWN_MS
}

const getPageWithRetry = async (pageId: string): Promise<ExtendedRecordMap> => {
  let lastError: unknown

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      return await notion.getPage(pageId)
    } catch (error) {
      lastError = error
      if (attempt === RETRY_DELAYS_MS.length || !isRetryableError(error)) {
        break
      }
      await wait(RETRY_DELAYS_MS[attempt])
    }
  }

  throw lastError
}

/** Rafraîchit une page en dédoublonnant les appels concurrents, et retombe sur `staleEntry` si fourni. */
const refreshPage = (pageId: string, staleEntry?: CacheEntry): Promise<ExtendedRecordMap> => {
  const pending = inFlight.get(pageId)
  if (pending) {
    return pending
  }

  const promise = getPageWithRetry(pageId)
    .then((recordMap) => {
      lastFailure.delete(pageId)
      rememberPage(pageId, recordMap)
      return recordMap
    })
    .catch((error) => {
      lastFailure.set(pageId, Date.now())
      // Mieux vaut servir une version périmée qu'une page en erreur : le contenu éditorial Notion
      // bouge rarement, et un 429 est transitoire.
      if (staleEntry) {
        captureException(error, { level: "warning", extra: { pageId, servedFrom: "stale-cache" } })
        return staleEntry.recordMap
      }
      throw error
    })
    .finally(() => {
      inFlight.delete(pageId)
    })

  inFlight.set(pageId, promise)
  return promise
}

const getPageResilient = async (pageId: string): Promise<ExtendedRecordMap> => {
  const cached = lastKnownGood.get(pageId)
  const age = cached ? Date.now() - cached.fetchedAt : Number.POSITIVE_INFINITY

  if (cached && age < TTL_MS) {
    return cached.recordMap
  }

  if (cached && age < MAX_STALE_MS) {
    // Périmé mais exploitable : on répond tout de suite et on rafraîchit en tâche de fond, pour
    // qu'aucune requête ne paie la latence Notion. Le rejet est déjà tracé dans `refreshPage`.
    if (!isInCooldown(pageId)) {
      void refreshPage(pageId, cached).catch(() => {
        // Déjà remonté à Sentry par `refreshPage` ; personne n'attend cette promesse.
      })
    }
    return cached.recordMap
  }

  if (isInCooldown(pageId)) {
    throw new Error(`Notion est indisponible pour la page ${pageId} (nouvelle tentative dans moins d'une minute)`)
  }

  return await refreshPage(pageId)
}

export const fetchNotionPage = async (pageId: string) => {
  "use cache"
  cacheLife("days") // revalider toutes les 24h (API Notion rate-limitée)

  return getPageResilient(pageId)
}
