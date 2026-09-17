import { captureException } from "@sentry/nextjs"
import { cacheLife } from "next/cache"
import { NotionAPI } from "notion-client"
import type { ExtendedRecordMap } from "notion-types"

// https://github.com/NotionX/react-notion-x/issues/710
// NOTION_API_BASE_URL sert à pointer sur un bouchon local pour rejouer les 429 (voir AGENTS.md).
const notion = new NotionAPI({ apiBaseUrl: process.env.NOTION_API_BASE_URL ?? "https://app.notion.com/api/v3" })

// `cacheLife("days")` ci-dessous ne suffit pas : `cacheMaxMemorySize: 0` (next.config.mjs) rend le
// cache handler "use cache" no-op en production, donc chaque requête retapait l'API Notion non
// officielle → 429 en rafale (issue Sentry LBA-UI-5CVZZZZZZG4TR). Ce cache process-level est
// indépendant du cache handler Next et sert aussi de dernier rempart (stale-if-error).
const TTL_MS = 24 * 60 * 60 * 1_000
const RETRY_DELAYS_MS = [500, 1_500, 4_000]

type CacheEntry = { recordMap: ExtendedRecordMap; fetchedAt: number }

const lastKnownGood = new Map<string, CacheEntry>()
const inFlight = new Map<string, Promise<ExtendedRecordMap>>()

const isRetryableError = (error: unknown): boolean => {
  const status =
    (error as { response?: { status?: number }; statusCode?: number; status?: number })?.response?.status ??
    (error as { statusCode?: number })?.statusCode ??
    (error as { status?: number })?.status

  if (typeof status === "number") {
    return status === 429 || status >= 500
  }
  // ofetch sérialise le code dans le message : `[POST] "…/loadPageChunk": 429`
  return /": (429|5\d\d)\b/.test((error as Error)?.message ?? "")
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

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

const getPageResilient = async (pageId: string): Promise<ExtendedRecordMap> => {
  const cached = lastKnownGood.get(pageId)
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
    return cached.recordMap
  }

  // Dédoublonne les requêtes concurrentes sur la même page (rafale au démarrage d'une instance).
  const pending = inFlight.get(pageId)
  if (pending) {
    return pending
  }

  const promise = getPageWithRetry(pageId)
    .then((recordMap) => {
      lastKnownGood.set(pageId, { recordMap, fetchedAt: Date.now() })
      return recordMap
    })
    .catch((error) => {
      // Mieux vaut servir une version périmée qu'une page en erreur : le contenu éditorial Notion
      // bouge rarement, et un 429 est transitoire.
      if (cached) {
        captureException(error, { level: "warning", extra: { pageId, servedFrom: "stale-cache" } })
        return cached.recordMap
      }
      throw error
    })
    .finally(() => {
      inFlight.delete(pageId)
    })

  inFlight.set(pageId, promise)
  return promise
}

export const fetchNotionPage = async (pageId: string) => {
  "use cache"
  cacheLife("days") // revalider toutes les 24h (API Notion rate-limitée)

  return getPageResilient(pageId)
}
