import jwt from "jsonwebtoken"
import { z } from "zod"

import getApiClient from "@/common/apis/client"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import config from "@/config"

/**
 * Client Google Indexing API (https://developers.google.com/search/apis/indexing-api/v3/using-api) :
 * auth OAuth2 par compte de service (JWT RS256 signé localement, échangé contre un access token —
 * pas besoin de google-auth-library, jsonwebtoken suffit), puis publication de notifications d'URL.
 * Le compte de service doit être propriétaire délégué de la propriété Search Console du domaine.
 */

const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
const GOOGLE_INDEXING_SCOPE = "https://www.googleapis.com/auth/indexing"
const GOOGLE_INDEXING_PUBLISH_ENDPOINT = "https://indexing.googleapis.com/v3/urlNotifications:publish"
const TOKEN_LIFETIME_SECONDS = 3600

const ZGoogleTokenResponse = z.object({
  access_token: z.string(),
  expires_in: z.number(),
})

const axiosClient = getApiClient({ timeout: 15_000 })

export const isGoogleIndexingConfigured = (): boolean => Boolean(config.googleIndexing.clientEmail && config.googleIndexing.privateKey)

/**
 * Les clés PEM stockées en variable d'environnement portent souvent des `\n` littéraux
 * (échappés) à la place des sauts de ligne : on restaure les deux formes.
 */
export const normalizePrivateKey = (privateKey: string): string => privateKey.replace(/\\n/g, "\n")

export const buildGoogleIndexingJwtClaims = (clientEmail: string, nowSeconds: number) => ({
  iss: clientEmail,
  scope: GOOGLE_INDEXING_SCOPE,
  aud: GOOGLE_TOKEN_ENDPOINT,
  iat: nowSeconds,
  exp: nowSeconds + TOKEN_LIFETIME_SECONDS,
})

let cachedToken: string | null = null
let tokenExpiresAt = 0

const getAccessToken = async (): Promise<string> => {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken
  }

  const claims = buildGoogleIndexingJwtClaims(config.googleIndexing.clientEmail!, Math.floor(Date.now() / 1000))
  const assertion = jwt.sign(claims, normalizePrivateKey(config.googleIndexing.privateKey!), { algorithm: "RS256" })

  const { data } = await axiosClient.post(
    GOOGLE_TOKEN_ENDPOINT,
    new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }).toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  )

  const validation = ZGoogleTokenResponse.safeParse(data)
  if (!validation.success) {
    throw new Error("google-indexing: format de réponse du endpoint de token invalide", { cause: validation.error })
  }

  cachedToken = validation.data.access_token
  // Marge de 10 % avant expiration réelle, comme les autres clients à token du projet.
  tokenExpiresAt = Date.now() + validation.data.expires_in * 1000 * 0.9
  return cachedToken
}

export type GoogleIndexingNotificationType = "URL_UPDATED" | "URL_DELETED"

export type PublishResult = "published" | "quota_exhausted" | "error"

/**
 * Publie une notification pour une URL. Ne throw jamais : renvoie un statut que l'appelant
 * peut agréger — `quota_exhausted` (HTTP 429) signale d'interrompre le run en cours.
 */
export const publishUrlNotification = async (url: string, type: GoogleIndexingNotificationType): Promise<PublishResult> => {
  try {
    const accessToken = await getAccessToken()
    await axiosClient.post(GOOGLE_INDEXING_PUBLISH_ENDPOINT, { url, type }, { headers: { Authorization: `Bearer ${accessToken}` } })
    return "published"
  } catch (err: any) {
    if (err.response?.status === 429) {
      return "quota_exhausted"
    }
    sentryCaptureException(err, { extra: { url, type, responseData: err.response?.data } })
    return "error"
  }
}
