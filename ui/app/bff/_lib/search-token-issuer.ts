import "server-only"

import { createChallenge, verifySolution } from "altcha-lib"
import { deriveKey } from "altcha-lib/algorithms/pbkdf2"
import type { Challenge } from "altcha-lib/types"
import { SEARCH_TOKEN_COOKIE_MAX_AGE, SEARCH_TOKEN_COOKIE_NAME } from "shared/constants/search-token"
import type { ISearchTokenKeys } from "shared/utils/search-token"
import { challengeSecret, parseSearchTokenKeys, signSearchToken } from "shared/utils/search-token"
import { z } from "zod"

import { BFF_PREFIX } from "@/utils/bff-routes"

// Preuve de travail : PBKDF2-SHA256 par WebCrypto côté navigateur (sans wasm). Il faut en moyenne
// 16^longueur(préfixe) essais de `cost` itérations. Point de départ à recalibrer sur un Android de milieu
// de gamme (cible : ~300 ms médian).
export const CHALLENGE_ALGORITHM = "PBKDF2/SHA-256"
export const CHALLENGE_COST = 1000
export const CHALLENGE_KEY_PREFIX = "00"
const CHALLENGE_TTL_SECONDS = 120

let cachedKeys: { raw: string; keys: ISearchTokenKeys } | null = null

function getKeys(): ISearchTokenKeys {
  const raw = process.env.LBA_SEARCH_TOKEN_KEYS
  if (!raw) throw new Error("LBA_SEARCH_TOKEN_KEYS manquant")
  if (cachedKeys?.raw !== raw) cachedKeys = { raw, keys: parseSearchTokenKeys(raw) }
  return cachedKeys.keys
}

export async function issueChallenge(now: Date): Promise<Challenge> {
  const { signing } = getKeys()
  return createChallenge({
    algorithm: CHALLENGE_ALGORITHM,
    cost: CHALLENGE_COST,
    keyPrefix: CHALLENGE_KEY_PREFIX,
    deriveKey,
    expiresAt: Math.floor(now.getTime() / 1000) + CHALLENGE_TTL_SECONDS,
    data: { kid: signing.kid },
    hmacSignatureSecret: challengeSecret(signing),
  })
}

const ZSolutionPayload = z.object({
  challenge: z.object({
    parameters: z.looseObject({
      algorithm: z.literal(CHALLENGE_ALGORITHM),
      nonce: z.string(),
      data: z.looseObject({ kid: z.string() }),
    }),
    signature: z.string(),
  }),
  solution: z.object({ counter: z.number(), derivedKey: z.string() }),
})

export type ISolutionCheck = { token: string } | { error: "payload" | "kid" | "expired" | "invalid" }

/** Vérifie la solution d'un défi émis par issueChallenge et renvoie le jeton de recherche signé. */
export async function redeemSolution(payload: unknown, now: Date): Promise<ISolutionCheck> {
  const parsed = ZSolutionPayload.safeParse(payload)
  if (!parsed.success) return { error: "payload" }

  const keys = getKeys()
  const key = keys.all.get(parsed.data.challenge.parameters.data.kid)
  if (!key) return { error: "kid" }

  const challenge = parsed.data.challenge as unknown as Challenge
  const result = await verifySolution({ challenge, solution: parsed.data.solution, hmacSignatureSecret: challengeSecret(key), deriveKey })
  if (result.expired) return { error: "expired" }
  if (!result.verified) return { error: "invalid" }

  return { token: signSearchToken(keys, challenge.parameters.nonce, now) }
}

// Partitionné et SameSite=None : le widget est affiché dans des iframes de sites tiers. Path restreint au
// BFF, le seul à le lire ; jamais posé sur une page.
export const SEARCH_TOKEN_COOKIE = {
  name: SEARCH_TOKEN_COOKIE_NAME,
  httpOnly: true,
  secure: true,
  sameSite: "none",
  partitioned: true,
  path: BFF_PREFIX,
  maxAge: SEARCH_TOKEN_COOKIE_MAX_AGE,
} as const
