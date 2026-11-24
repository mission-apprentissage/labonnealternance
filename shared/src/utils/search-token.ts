import { createHmac, hkdfSync, timingSafeEqual } from "node:crypto"

import { SEARCH_TOKEN_SLOT_SECONDS } from "../constants/search-token.js"

// Format : v1.<kid>.<tranche>.<nonce>.<mac>
// - kid : identifiant de la clé qui signe, pour garder deux secrets actifs pendant une rotation ;
// - tranche : heure d'émission (floor(epoch / 3600)), acceptée sur la tranche courante et la précédente ;
// - nonce : nonce du défi ALTCHA résolu, identifiant du quota (cf. search_tokens) ;
// - mac : HMAC-SHA256 de "v1|tranche|nonce" par la sous-clé « jeton » du kid, en base64url.
const VERSION = "v1"
const KID_PATTERN = /^[a-z0-9]{1,16}$/
const NONCE_PATTERN = /^[0-9a-f]{32}$/
const MIN_SECRET_BYTES = 32

export type ISearchTokenKey = { kid: string; tokenKey: Buffer; challengeKey: Buffer }
export type ISearchTokenKeys = { signing: ISearchTokenKey; all: Map<string, ISearchTokenKey> }

// Une seule valeur secrète par kid, dérivée en deux sous-clés : la signature des jetons et celle des
// défis ALTCHA ne peuvent pas se substituer l'une à l'autre.
const deriveSubKey = (secret: Buffer, info: "jeton" | "altcha"): Buffer => Buffer.from(hkdfSync("sha256", secret, Buffer.alloc(0), info, 32))

/**
 * `LBA_SEARCH_TOKEN_KEYS="k2:<base64>,k1:<base64>"` : la première clé signe, toutes vérifient.
 * Rotation : ajouter la nouvelle en 2e position, déployer, la passer en 1re, déployer, retirer l'ancienne
 * deux heures plus tard (durée de vie maximale d'un jeton).
 */
export function parseSearchTokenKeys(raw: string): ISearchTokenKeys {
  const entries = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
  if (entries.length === 0) {
    throw new Error("LBA_SEARCH_TOKEN_KEYS vide")
  }
  const all = new Map<string, ISearchTokenKey>()
  const ordered: ISearchTokenKey[] = []
  for (const entry of entries) {
    const separator = entry.indexOf(":")
    const kid = entry.slice(0, separator)
    const secret = Buffer.from(entry.slice(separator + 1), "base64")
    if (separator <= 0 || !KID_PATTERN.test(kid)) {
      throw new Error(`LBA_SEARCH_TOKEN_KEYS : identifiant de clé invalide « ${kid} »`)
    }
    if (secret.length < MIN_SECRET_BYTES) {
      throw new Error(`LBA_SEARCH_TOKEN_KEYS : la clé ${kid} doit faire au moins ${MIN_SECRET_BYTES} octets`)
    }
    if (all.has(kid)) {
      throw new Error(`LBA_SEARCH_TOKEN_KEYS : clé ${kid} en double`)
    }
    const key = { kid, tokenKey: deriveSubKey(secret, "jeton"), challengeKey: deriveSubKey(secret, "altcha") }
    all.set(kid, key)
    ordered.push(key)
  }
  return { signing: ordered[0], all }
}

/** Secret de signature des défis ALTCHA (chaîne hexadécimale attendue par altcha-lib). */
export const challengeSecret = (key: ISearchTokenKey): string => key.challengeKey.toString("hex")

export const currentSlot = (now: Date): number => Math.floor(now.getTime() / 1000 / SEARCH_TOKEN_SLOT_SECONDS)

const mac = (key: ISearchTokenKey, slot: number, nonce: string): string => createHmac("sha256", key.tokenKey).update(`${VERSION}|${slot}|${nonce}`).digest("base64url")

export function signSearchToken(keys: ISearchTokenKeys, nonce: string, now: Date): string {
  if (!NONCE_PATTERN.test(nonce)) {
    throw new Error("nonce de jeton invalide")
  }
  const slot = currentSlot(now)
  return [VERSION, keys.signing.kid, slot, nonce, mac(keys.signing, slot, nonce)].join(".")
}

export type ISearchTokenVerification = { valid: true; kid: string; nonce: string } | { valid: false; reason: "format" | "kid" | "mac" | "expired" }

export function verifySearchToken(keys: ISearchTokenKeys, token: string, now: Date): ISearchTokenVerification {
  const parts = token.split(".")
  if (parts.length !== 5) return { valid: false, reason: "format" }
  const [version, kid, rawSlot, nonce, receivedMac] = parts
  if (version !== VERSION || !/^\d{1,12}$/.test(rawSlot) || !NONCE_PATTERN.test(nonce)) return { valid: false, reason: "format" }

  const key = keys.all.get(kid)
  if (!key) return { valid: false, reason: "kid" }

  const slot = Number(rawSlot)
  const expected = Buffer.from(mac(key, slot, nonce))
  const received = Buffer.from(receivedMac)
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return { valid: false, reason: "mac" }

  const nowSlot = currentSlot(now)
  if (slot !== nowSlot && slot !== nowSlot - 1) return { valid: false, reason: "expired" }

  return { valid: true, kid, nonce }
}
