import "server-only"

import { captureException, captureMessage } from "@sentry/nextjs"
import { CONTAINER_BLOCK_TYPES, type NotionBlock, type OpcoGuide, structureOpcoGuide } from "./notion-guide"

// Page « Guide de modération » de l'espace Notion « Contenus web ». Elle est privée : seule l'intégration
// dont le jeton est dans LBA_NOTION_API_TOKEN peut la lire. Ne jamais la publier sur le web.
export const OPCO_GUIDE_NOTION_PAGE_ID = "4230c88032c881f1b4e5e58a3849ef90"

const NOTION_API_URL = "https://api.notion.com/v1"
const NOTION_VERSION = "2026-03-11"

// Cache process, comme fetch-notion-page.ts. Divergences : TTL plus court (le guide est relu après chaque
// mise à jour des règles d'analyse) et pas de "use cache", qui pourrait figer ce texte restreint dans le build.
const TTL_MS = 15 * 60 * 1_000
const MAX_STALE_MS = 7 * 24 * 60 * 60 * 1_000
const FAILURE_COOLDOWN_MS = 60 * 1_000
const RETRY_DELAYS_MS = [500, 1_500]

export type OpcoGuideResult = { status: "ok"; guide: OpcoGuide } | { status: "unavailable" }

class NotionApiError extends Error {
  constructor(readonly status: number) {
    super(`API Notion : HTTP ${status}`)
  }
}

let cached: { guide: OpcoGuide; fetchedAt: number } | null = null
let inFlight: Promise<OpcoGuide> | null = null
let lastFailureAt: number | null = null
let missingTokenReported = false

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const isRetryable = (error: unknown) => !(error instanceof NotionApiError) || error.status === 429 || error.status >= 500

async function notionGet(path: string, token: string): Promise<{ results: NotionBlock[]; has_more: boolean; next_cursor: string | null }> {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(`${NOTION_API_URL}${path}`, {
        headers: { Authorization: `Bearer ${token}`, "Notion-Version": NOTION_VERSION },
        cache: "no-store",
      })
      if (!response.ok) throw new NotionApiError(response.status)
      return await response.json()
    } catch (error) {
      if (attempt >= RETRY_DELAYS_MS.length || !isRetryable(error)) throw error
      await wait(RETRY_DELAYS_MS[attempt])
    }
  }
}

// Appels séquentiels : l'API Notion limite à environ 3 requêtes par seconde.
async function listChildren(blockId: string, token: string): Promise<NotionBlock[]> {
  const blocks: NotionBlock[] = []
  let cursor: string | null = null
  do {
    const query = new URLSearchParams({ page_size: "100" })
    if (cursor) query.set("start_cursor", cursor)
    const page = await notionGet(`/blocks/${blockId}/children?${query}`, token)
    blocks.push(...page.results)
    cursor = page.has_more ? page.next_cursor : null
  } while (cursor)

  for (const block of blocks) {
    if (block.has_children && CONTAINER_BLOCK_TYPES.has(block.type)) {
      block.children = await listChildren(block.id, token)
    }
  }
  return blocks
}

// Les messages remontés ne contiennent jamais le texte du guide, seulement le statut ou la structure.
async function loadGuide(token: string): Promise<OpcoGuide> {
  const structure = structureOpcoGuide(await listChildren(OPCO_GUIDE_NOTION_PAGE_ID, token))
  if (structure.status === "invalid") {
    throw new Error(`Guide de modération OPCO : structure Notion refusée (${structure.reason})`)
  }
  if (structure.unsupportedTypes.length > 0) {
    captureMessage("Guide de modération OPCO : blocs Notion non rendus", { level: "warning", extra: { types: structure.unsupportedTypes } })
  }
  return structure.guide
}

function refresh(token: string): Promise<OpcoGuide> {
  inFlight ??= loadGuide(token)
    .then((guide) => {
      cached = { guide, fetchedAt: Date.now() }
      lastFailureAt = null
      return guide
    })
    .catch((error) => {
      lastFailureAt = Date.now()
      captureException(error, { level: "warning", extra: { servedFrom: cached ? "stale-cache" : "fallback" } })
      throw error
    })
    .finally(() => {
      inFlight = null
    })
  return inFlight
}

/**
 * Contenu du guide, ou "unavailable" : la page affiche alors ses sections vides. Toute dégradation remonte
 * à Sentry (jeton absent, API en erreur, structure refusée, blocs non rendus).
 */
export async function fetchOpcoGuide(): Promise<OpcoGuideResult> {
  const token = process.env.LBA_NOTION_API_TOKEN
  if (!token) {
    if (!missingTokenReported) {
      missingTokenReported = true
      captureMessage("Guide de modération OPCO : LBA_NOTION_API_TOKEN absent, guide affiché sans contenu", { level: "warning" })
    }
    return { status: "unavailable" }
  }

  const age = cached ? Date.now() - cached.fetchedAt : Number.POSITIVE_INFINITY
  if (cached && age < TTL_MS) return { status: "ok", guide: cached.guide }

  const inCooldown = lastFailureAt !== null && Date.now() - lastFailureAt < FAILURE_COOLDOWN_MS

  if (cached && age < MAX_STALE_MS) {
    if (!inCooldown) {
      void refresh(token).catch(() => {
        // Déjà remonté à Sentry par refresh ; personne n'attend cette promesse.
      })
    }
    return { status: "ok", guide: cached.guide }
  }
  if (inCooldown) return { status: "unavailable" }

  try {
    return { status: "ok", guide: await refresh(token) }
  } catch {
    return { status: "unavailable" }
  }
}
