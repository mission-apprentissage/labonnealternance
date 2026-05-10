import { internal } from "@hapi/boom"
import { z } from "zod"

import getApiClient from "@/common/apis/client"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import config from "@/config"

const OMOGEN_BASE_URL = "https://omogen-api-pr.phm.education.gouv.fr"

const ZOmogenAuthApi = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  token_type: z.string(),
})

const axiosClient = getApiClient({})

let omogenToken: string | null = null
let tokenRefreshTimeout: NodeJS.Timeout | null = null
let tokenFetchPromise: Promise<string> | null = null
let tokenFailureCooldownUntil: number = 0
const TOKEN_FAILURE_COOLDOWN_MS = 60_000

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const getOmogenToken = async (): Promise<string> => {
  if (omogenToken) return omogenToken

  if (tokenFetchPromise) return tokenFetchPromise

  if (Date.now() < tokenFailureCooldownUntil) {
    throw internal("impossible d'obtenir un token pour l'API Omogen")
  }

  tokenFetchPromise = (async () => {
    try {
      const requestBody = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: config.inserjeunes.clientId,
        client_secret: config.inserjeunes.clientSecret,
      })

      const { data } = await axiosClient.post(`${OMOGEN_BASE_URL}/auth/token`, requestBody.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "x-Omogen-api-key": config.inserjeunes.apiKey,
        },
      })

      const validation = ZOmogenAuthApi.safeParse(data)
      if (!validation.success) {
        throw internal("Format de retour de l'api d'authentification Omogen non valide", { error: validation.error })
      }

      omogenToken = validation.data.access_token

      if (tokenRefreshTimeout) {
        clearTimeout(tokenRefreshTimeout)
      }

      tokenRefreshTimeout = setTimeout(
        () => {
          omogenToken = null
          tokenFetchPromise = null
        },
        validation.data.expires_in * 1000 * 0.9
      )

      return validation.data.access_token
    } catch (error: any) {
      tokenFailureCooldownUntil = Date.now() + TOKEN_FAILURE_COOLDOWN_MS
      sentryCaptureException(error, { extra: { responseData: error.response?.data } })
      throw internal("impossible d'obtenir un token pour l'API Omogen")
    } finally {
      tokenFetchPromise = null
    }
  })()

  return tokenFetchPromise
}

const TRANSIENT_CODES = new Set(["ECONNRESET", "ECONNABORTED", "ETIMEDOUT"])
const SILENT_HTTP_STATUSES = new Set([404, 502, 503])

/**
 * Fetch InserJeune statistics for a specific certification and region
 */
export const fetchInserJeunesStats = async (zipcode: string, cfd: string, attempt = 0): Promise<unknown> => {
  try {
    const token = await getOmogenToken()
    const { data } = await axiosClient.get(`${OMOGEN_BASE_URL}/exposition-inserjeunes-insersup/api/inserjeunes/regionales/${zipcode}/certifications/${cfd}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return data
  } catch (error: any) {
    const status: number | undefined = error.response?.status
    const code: string | undefined = error.code

    if (status === 404) {
      return null
    }

    if (status === 503 || status === 502) {
      return null
    }

    if (code && TRANSIENT_CODES.has(code) && attempt < 2) {
      await delay(500 * 2 ** attempt)
      return fetchInserJeunesStats(zipcode, cfd, attempt + 1)
    }

    if (!SILENT_HTTP_STATUSES.has(status as number)) {
      sentryCaptureException(error, { extra: { responseData: error.response?.data, zipcode, cfd } })
    }
    throw internal("Erreur lors de la récupération des données InserJeunes")
  }
}
