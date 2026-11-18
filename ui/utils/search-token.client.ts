import { solveChallenge } from "altcha-lib"
import { deriveKey } from "altcha-lib/algorithms/web/pbkdf2"
import type { Challenge } from "altcha-lib/types"

import { BFF_PREFIX } from "@/utils/bff-routes"
import { setSearchToken } from "@/utils/search-token.store"

const ISSUE_URL = `${BFF_PREFIX}/jeton`
const SOLVE_TIMEOUT_MS = 15_000

export class SearchTokenError extends Error {
  name = "SearchTokenError"
}

async function issueSearchToken(): Promise<void> {
  const challengeResponse = await fetch(ISSUE_URL, { credentials: "same-origin", cache: "no-store" })
  if (!challengeResponse.ok) throw new SearchTokenError(`défi indisponible (${challengeResponse.status})`)
  const challenge: Challenge = await challengeResponse.json()

  const solution = await solveChallenge({ challenge, deriveKey, timeout: SOLVE_TIMEOUT_MS })
  if (!solution) throw new SearchTokenError("preuve de travail non résolue dans le délai")

  const redeemResponse = await fetch(ISSUE_URL, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ challenge, solution }),
  })
  if (!redeemResponse.ok) throw new SearchTokenError(`jeton refusé (${redeemResponse.status})`)
  const { token } = (await redeemResponse.json()) as { token?: unknown }
  if (typeof token !== "string") throw new SearchTokenError("réponse d'émission sans jeton")
  setSearchToken(token)
}

let pending: Promise<void> | null = null
let renewedAt = 0

/**
 * Obtient un nouveau jeton (cookie et copie en mémoire). Les appels refusés en même temps (recherche,
 * suggestion) partagent la même preuve de travail ; un refus antérieur à un renouvellement déjà terminé est
 * simplement rejoué.
 */
export function renewSearchToken(rejectedRequestStartedAt: number): Promise<void> {
  if (renewedAt > rejectedRequestStartedAt) return Promise.resolve()
  pending ??= issueSearchToken()
    .then(() => {
      renewedAt = performance.now()
    })
    .finally(() => {
      pending = null
    })
  return pending
}
