import { createHmac, randomBytes } from "node:crypto"
import { describe, expect, it } from "vitest"

import { parseSearchTokenKeys, signSearchToken, verifySearchToken } from "./search-token.js"

const secret = () => randomBytes(32).toString("base64")
const NONCE = "0123456789abcdef0123456789abcdef"
const NOW = new Date("2026-11-18T10:30:00Z")
const ONE_HOUR = 3600 * 1000

describe("verifySearchToken : refus", () => {
  const keys = parseSearchTokenKeys(`k2:${secret()},k1:${secret()}`)
  const token = signSearchToken(keys, NONCE, NOW)

  it("refuse un jeton de la tranche n-2", () => {
    expect(verifySearchToken(keys, token, new Date(NOW.getTime() + 2 * ONE_HOUR))).toEqual({ valid: false, reason: "expired" })
  })

  it("refuse un jeton d'une tranche future", () => {
    const future = signSearchToken(keys, NONCE, new Date(NOW.getTime() + ONE_HOUR))
    expect(verifySearchToken(keys, future, NOW)).toEqual({ valid: false, reason: "expired" })
  })

  it("refuse un kid inconnu", () => {
    const other = parseSearchTokenKeys(`k9:${secret()}`)
    expect(verifySearchToken(keys, signSearchToken(other, NONCE, NOW), NOW)).toEqual({ valid: false, reason: "kid" })
  })

  it("refuse un kid connu signé avec le secret d'un autre kid", () => {
    const [, k2, slot, nonce, mac] = token.split(".")
    expect(k2).toBe("k2")
    expect(verifySearchToken(keys, ["v1", "k1", slot, nonce, mac].join("."), NOW)).toEqual({ valid: false, reason: "mac" })
  })

  it("refuse un jeton signé par la sous-clé des défis plutôt que celle des jetons", () => {
    const [v, kid, slot, nonce] = token.split(".")
    const wrongMac = createHmac("sha256", keys.signing.challengeKey).update(`v1|${slot}|${nonce}`).digest("base64url")
    expect(verifySearchToken(keys, [v, kid, slot, nonce, wrongMac].join("."), NOW)).toEqual({ valid: false, reason: "mac" })
  })

  it("refuse un nonce altéré", () => {
    const parts = token.split(".")
    parts[3] = "f" + parts[3].slice(1)
    expect(verifySearchToken(keys, parts.join("."), NOW)).toEqual({ valid: false, reason: "mac" })
  })

  it("refuse une tranche décalée avec le même mac", () => {
    const parts = token.split(".")
    parts[2] = String(Number(parts[2]) - 1)
    expect(verifySearchToken(keys, parts.join("."), NOW)).toEqual({ valid: false, reason: "mac" })
  })

  it.each([
    ["version inconnue", token.replace(/^v1\./, "v2.")],
    ["segment manquant", token.split(".").slice(0, 4).join(".")],
    ["segment en trop", `${token}.x`],
    ["nonce non hexadécimal", token.replace(NONCE, "Z".repeat(32))],
    ["chaîne vide", ""],
  ])("refuse un format invalide : %s", (_label, value) => {
    expect(verifySearchToken(keys, value, NOW)).toEqual({ valid: false, reason: "format" })
  })
})

describe("verifySearchToken : acceptation", () => {
  it("accepte la tranche courante et la précédente", () => {
    const keys = parseSearchTokenKeys(`k1:${secret()}`)
    const token = signSearchToken(keys, NONCE, NOW)
    expect(verifySearchToken(keys, token, NOW)).toEqual({ valid: true, kid: "k1", nonce: NONCE })
    expect(verifySearchToken(keys, token, new Date(NOW.getTime() + ONE_HOUR))).toEqual({ valid: true, kid: "k1", nonce: NONCE })
  })

  it("accepte pendant une rotation un jeton signé par l'ancienne clé passée en 2e position", () => {
    const old = secret()
    const before = parseSearchTokenKeys(`k1:${old}`)
    const during = parseSearchTokenKeys(`k2:${secret()},k1:${old}`)
    expect(verifySearchToken(during, signSearchToken(before, NONCE, NOW), NOW)).toMatchObject({ valid: true, kid: "k1" })
    expect(signSearchToken(during, NONCE, NOW).split(".")[1]).toBe("k2")
  })
})

describe("parseSearchTokenKeys", () => {
  it.each([
    ["vide", ""],
    ["secret trop court", `k1:${randomBytes(16).toString("base64")}`],
    ["sans kid", `:${secret()}`],
    ["kid invalide", `K-1:${secret()}`],
    ["kid en double", `k1:${secret()},k1:${secret()}`],
  ])("rejette une configuration %s", (_label, raw) => {
    expect(() => parseSearchTokenKeys(raw)).toThrow()
  })
})
