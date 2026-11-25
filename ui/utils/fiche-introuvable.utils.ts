import { captureException } from "@sentry/nextjs"
import type { NextRequest } from "next/server"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { getServerApiEndpoint } from "@/utils/server-api-endpoint"

// Les fiches emploi et formation streament (loading.tsx, cacheComponents) : le 200 part avant que la page
// n'appelle notFound(), et Next n'injecte alors qu'un noindex. Seul le proxy, qui répond avant le rendu,
// peut renvoyer un vrai 404 (node_modules/next/dist/docs, loading.md « Status Codes »).

const JOB_TYPES: ReadonlySet<string> = new Set([LBA_ITEM_TYPE.RECRUTEURS_LBA, LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES])

// L'API répond 400 à un id qui n'est pas un ObjectId sur ces types (jobs.controller), et la page lève alors
// une erreur servie en 200 : on conclut sans appel.
const OBJECT_ID_JOB_TYPES: ReadonlySet<string> = new Set([LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES])
const OBJECT_ID = /^[0-9a-f]{24}$/i

// p99 des routes /_private/jobs et /_private/formations en production : ~65 ms.
const LOOKUP_TIMEOUT_MS = 1000

type FicheLookup = { kind: "api"; apiPath: string } | { kind: "introuvable" }

/**
 * Segment d'URL de l'API pour un id lu, encodé, dans le chemin de la page. Décoder puis ré-encoder garde
 * les ids réels (clés formation en `%23`) et interdit de sortir du segment (`%2F`, `.`, `..`).
 */
function toApiSegment(rawId: string): string | null {
  let id: string
  try {
    id = decodeURIComponent(rawId)
  } catch {
    return null
  }
  if (!id || id === "." || id === "..") return null
  return encodeURIComponent(id)
}

export function resolveFicheLookup(pathname: string): FicheLookup | null {
  const emploi = /^\/emploi\/([^/]+)\/([^/]+)\/[^/]+\/?$/.exec(pathname)
  if (emploi) {
    const [, type, rawId] = emploi
    if (!JOB_TYPES.has(type)) return { kind: "introuvable" }
    const segment = toApiSegment(rawId)
    if (!segment) return null
    if (OBJECT_ID_JOB_TYPES.has(type) && !OBJECT_ID.test(segment)) return { kind: "introuvable" }
    return { kind: "api", apiPath: `/_private/jobs/${type}/${segment}` }
  }

  const formation = /^\/formation\/([^/]+)\/[^/]+\/?$/.exec(pathname)
  if (formation) {
    const segment = toApiSegment(formation[1])
    return segment ? { kind: "api", apiPath: `/_private/formations/${segment}` } : null
  }

  return null
}

// Navigation client et préchargement : le statut HTTP n'y est pas lu, le payload RSC porte le notFound().
const isDocumentRequest = (request: NextRequest): boolean =>
  (request.method === "GET" || request.method === "HEAD") &&
  !request.headers.has("rsc") &&
  !request.headers.has("next-router-prefetch") &&
  !request.headers.has("next-router-segment-prefetch")

// Un seul issue Sentry pour tous les échecs : sans lui, une API injoignable rendrait le 404 inerte sans bruit.
function reportLookupFailure(apiPath: string, cause: unknown) {
  captureException(cause instanceof Error ? cause : new Error(String(cause)), {
    level: "warning",
    fingerprint: ["fiche-introuvable-lookup"],
    extra: { apiPath },
  })
}

/**
 * Vrai seulement sur un 404 confirmé par l'API. Panne, timeout, 429 ou 5xx laissent passer, signalés à
 * Sentry : la page garde alors son comportement (notFound() en streaming ou page d'erreur).
 */
export async function isFicheIntrouvable(request: NextRequest): Promise<boolean> {
  if (!isDocumentRequest(request)) return false

  const lookup = resolveFicheLookup(request.nextUrl.pathname)
  if (!lookup) return false
  if (lookup.kind === "introuvable") return true

  try {
    const response = await fetch(`${getServerApiEndpoint()}${lookup.apiPath}`, {
      method: "GET",
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
    })
    await response.body?.cancel()
    if (response.status === 404) return true
    if (!response.ok) reportLookupFailure(lookup.apiPath, new Error(`Vérification de fiche : HTTP ${response.status}`))
    return false
  } catch (error) {
    reportLookupFailure(lookup.apiPath, error)
    return false
  }
}
