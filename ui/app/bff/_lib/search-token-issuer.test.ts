import { randomBytes } from "node:crypto"
import { createChallenge, solveChallenge } from "altcha-lib"
import { deriveKey } from "altcha-lib/algorithms/pbkdf2"
import type { Challenge } from "altcha-lib/types"
import { parseSearchTokenKeys, verifySearchToken } from "shared/utils/search-token"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

const { CHALLENGE_ALGORITHM, CHALLENGE_COST, CHALLENGE_KEY_PREFIX, issueChallenge, redeemSolution } = await import("./search-token-issuer")

const KEYS = `k2:${randomBytes(32).toString("base64")},k1:${randomBytes(32).toString("base64")}`
const NOW = new Date()

const solve = async (challenge: Challenge) => {
  const solution = await solveChallenge({ challenge, deriveKey })
  if (!solution) throw new Error("défi non résolu")
  return solution
}

beforeEach(() => vi.stubEnv("LBA_SEARCH_TOKEN_KEYS", KEYS))
afterEach(() => vi.unstubAllEnvs())

describe("redeemSolution : refus", () => {
  it("refuse un défi expiré", async () => {
    const challenge = await issueChallenge(new Date(NOW.getTime() - 10 * 60 * 1000))
    expect(await redeemSolution({ challenge, solution: await solve(challenge) }, NOW)).toEqual({ error: "expired" })
  })

  it("refuse un défi dont la difficulté a été abaissée", async () => {
    const challenge = await issueChallenge(NOW)
    const tampered = { ...challenge, parameters: { ...challenge.parameters, cost: 1 } }
    expect(await redeemSolution({ challenge: tampered, solution: await solve(tampered) }, NOW)).toEqual({ error: "invalid" })
  })

  it("refuse un défi forgé avec la sous-clé des jetons", async () => {
    const keys = parseSearchTokenKeys(KEYS)
    const forged = await createChallenge({
      algorithm: CHALLENGE_ALGORITHM,
      cost: CHALLENGE_COST,
      keyPrefix: CHALLENGE_KEY_PREFIX,
      deriveKey,
      expiresAt: Math.floor(NOW.getTime() / 1000) + 60,
      data: { kid: "k2" },
      hmacSignatureSecret: keys.signing.tokenKey.toString("hex"),
    })
    expect(await redeemSolution({ challenge: forged, solution: await solve(forged) }, NOW)).toEqual({ error: "invalid" })
  })

  it("refuse un kid inconnu", async () => {
    const challenge = await issueChallenge(NOW)
    const otherKid = { ...challenge, parameters: { ...challenge.parameters, data: { kid: "k9" } } }
    expect(await redeemSolution({ challenge: otherKid, solution: await solve(challenge) }, NOW)).toEqual({ error: "kid" })
  })

  it("refuse une mauvaise solution", async () => {
    const challenge = await issueChallenge(NOW)
    const solution = await solve(challenge)
    expect(await redeemSolution({ challenge, solution: { ...solution, counter: solution.counter + 1 } }, NOW)).toEqual({ error: "invalid" })
  })

  it.each([null, {}, { challenge: {} }, "texte"])("refuse un corps malformé : %j", async (payload) => {
    expect(await redeemSolution(payload, NOW)).toEqual({ error: "payload" })
  })
})

describe("redeemSolution : émission", () => {
  it("émet un jeton signé par la clé active, vérifiable par l'API", async () => {
    const challenge = await issueChallenge(NOW)
    const result = await redeemSolution({ challenge, solution: await solve(challenge) }, NOW)
    expect(result).toHaveProperty("token")
    const verification = verifySearchToken(parseSearchTokenKeys(KEYS), (result as { token: string }).token, NOW)
    expect(verification).toEqual({ valid: true, kid: "k2", nonce: challenge.parameters.nonce })
  })

  it("redonne le même jeton pour une solution rejouée (même quota)", async () => {
    const challenge = await issueChallenge(NOW)
    const solution = await solve(challenge)
    expect(await redeemSolution({ challenge, solution }, NOW)).toEqual(await redeemSolution({ challenge, solution }, NOW))
  })

  it("accepte pendant une rotation un défi émis par l'ancienne clé", async () => {
    const [newer, older] = KEYS.split(",")
    vi.stubEnv("LBA_SEARCH_TOKEN_KEYS", older)
    const challenge = await issueChallenge(NOW)
    vi.stubEnv("LBA_SEARCH_TOKEN_KEYS", `${newer},${older}`)
    const result = await redeemSolution({ challenge, solution: await solve(challenge) }, NOW)
    expect((result as { token: string }).token.split(".")[1]).toBe("k2")
  })
})
