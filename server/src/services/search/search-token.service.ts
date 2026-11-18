import { unauthorized } from "@hapi/boom"
import type { FastifyRequest } from "fastify"
import type { ISearchSiteChannel } from "shared/constants/search-token"
import { SEARCH_CHANNEL_HEADER, SEARCH_CHANNELS, SEARCH_TOKEN_EXHAUSTED, SEARCH_TOKEN_HEADER, SEARCH_TOKEN_QUOTA, SEARCH_TOKEN_REQUIRED } from "shared/constants/search-token"
import { verifySearchToken } from "shared/utils/search-token"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { isPrivateIp } from "@/common/utils/private-network"
import config from "@/config"

// Au-delà de la durée de vie maximale d'un jeton (2 tranches horaires).
const TOKEN_RETENTION_MS = 3 * 3600 * 1000

const headerValue = (req: FastifyRequest, name: string): string | undefined => {
  const value = req.headers[name]
  return typeof value === "string" ? value : undefined
}

// Adresse du pair TCP, et non req.ip (résolu depuis X-Forwarded-For) : seuls les appelants du réseau docker
// (BFF de l'UI, nginx) peuvent annoncer un canal.
const fromDockerNetwork = (req: FastifyRequest): boolean => isPrivateIp(req.socket.remoteAddress ?? "")

/** Canal annoncé par le BFF de l'UI ; null pour tout autre appelant. Signal statistique, pas un contrôle d'accès. */
export function getSearchChannel(req: FastifyRequest): ISearchSiteChannel | null {
  const channel = headerValue(req, SEARCH_CHANNEL_HEADER)
  if (!fromDockerNetwork(req) || !channel) return null
  return (SEARCH_CHANNELS as readonly string[]).includes(channel) ? (channel as ISearchSiteChannel) : null
}

/**
 * Exige un jeton de recherche valide pour tout appel d'une IP publique et pour tout appel relayé par le BFF
 * (en-tête de canal présent). Le rendu serveur de l'UI (IP privée, sans canal) n'en a pas besoin.
 * `count` : la recherche consomme le quota du jeton ; une suggestion ne le consomme pas.
 */
export async function requireSearchToken(req: FastifyRequest, { count }: { count: boolean }): Promise<void> {
  const relayedBySite = req.headers[SEARCH_CHANNEL_HEADER] !== undefined
  if (isPrivateIp(req.ip) && !relayedBySite) return

  const token = headerValue(req, SEARCH_TOKEN_HEADER)
  const now = new Date()
  const verification = token ? verifySearchToken(config.searchTokenKeys, token, now) : null
  if (!verification?.valid) {
    throw unauthorized(SEARCH_TOKEN_REQUIRED)
  }
  if (!count) return

  const usage = await getDbCollection("search_tokens").findOneAndUpdate(
    { _id: verification.nonce },
    { $inc: { count: 1 }, $setOnInsert: { created_at: now, expires_at: new Date(now.getTime() + TOKEN_RETENTION_MS) } },
    { upsert: true, returnDocument: "after" }
  )
  if (usage && usage.count > SEARCH_TOKEN_QUOTA) {
    throw unauthorized(SEARCH_TOKEN_EXHAUSTED)
  }
}
