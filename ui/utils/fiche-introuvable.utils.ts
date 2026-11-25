import type { NextRequest } from "next/server"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { getServerApiEndpoint } from "@/utils/server-api-endpoint"

// Les fiches emploi et formation streament (loading.tsx, cacheComponents) : le 200 part avant que la page
// n'appelle notFound(), et Next n'injecte alors qu'un noindex. Seul le proxy, qui répond avant le rendu,
// peut renvoyer un vrai 404 (node_modules/next/dist/docs, loading.md « Status Codes »).

const JOB_TYPES: ReadonlySet<string> = new Set([LBA_ITEM_TYPE.RECRUTEURS_LBA, LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES])

// Identifiant repris tel quel dans l'URL de l'API : caractères non réservés seulement, rien d'encodé.
const SAFE_ID = /^[A-Za-z0-9._~-]+$/

const LOOKUP_TIMEOUT_MS = 2000

type FicheLookup = { kind: "api"; apiPath: string } | { kind: "type-inconnu" }

export function resolveFicheLookup(pathname: string): FicheLookup | null {
  const emploi = /^\/emploi\/([^/]+)\/([^/]+)\/[^/]+\/?$/.exec(pathname)
  if (emploi) {
    const [, type, id] = emploi
    if (!JOB_TYPES.has(type)) return { kind: "type-inconnu" }
    return SAFE_ID.test(id) ? { kind: "api", apiPath: `/_private/jobs/${type}/${id}` } : null
  }

  const formation = /^\/formation\/([^/]+)\/[^/]+\/?$/.exec(pathname)
  if (formation) {
    const [, id] = formation
    return SAFE_ID.test(id) ? { kind: "api", apiPath: `/_private/formations/${id}` } : null
  }

  return null
}

// Navigation client et préchargement : le statut HTTP n'y est pas lu, le payload RSC porte le notFound().
const isDocumentRequest = (request: NextRequest): boolean =>
  (request.method === "GET" || request.method === "HEAD") &&
  !request.headers.has("rsc") &&
  !request.headers.has("next-router-prefetch") &&
  !request.headers.has("next-router-segment-prefetch")

/**
 * Vrai seulement sur un 404 confirmé par l'API. Panne, timeout, 429 ou 5xx laissent passer : la page
 * garde alors son comportement (notFound() en streaming ou page d'erreur).
 */
export async function isFicheIntrouvable(request: NextRequest): Promise<boolean> {
  if (!isDocumentRequest(request)) return false

  const lookup = resolveFicheLookup(request.nextUrl.pathname)
  if (!lookup) return false
  if (lookup.kind === "type-inconnu") return true

  try {
    const response = await fetch(`${getServerApiEndpoint()}${lookup.apiPath}`, {
      method: "GET",
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
    })
    await response.body?.cancel()
    return response.status === 404
  } catch {
    return false
  }
}
