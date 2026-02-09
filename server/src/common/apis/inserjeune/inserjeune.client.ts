import { internal } from "@hapi/boom"
import { z } from "zod"

import getApiClient from "@/common/apis/client"
import { logger } from "@/common/logger"
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

const getOmogenToken = async (): Promise<string> => {
  if (omogenToken) return omogenToken

  // If a token fetch is already in progress, wait for it
  if (tokenFetchPromise) return tokenFetchPromise

  // Start a new token fetch
  tokenFetchPromise = (async () => {
    try {
      logger.info(`Récupération du token pour l'API Omogen InserJeune`)
      const requestBody = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: config.inserjeune.clientId,
        client_secret: config.inserjeune.clientSecret,
      })

      const { data } = await axiosClient.post(`${OMOGEN_BASE_URL}/auth/token`, requestBody.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "x-Omogen-api-key": config.inserjeune.apiKey,
        },
      })

      const validation = ZOmogenAuthApi.safeParse(data)
      if (!validation.success) {
        throw internal("Format de retour de l'api d'authentification Omogen non valide", { error: validation.error })
      }

      omogenToken = validation.data.access_token

      // Clear any existing timeout
      if (tokenRefreshTimeout) {
        clearTimeout(tokenRefreshTimeout)
      }

      // Refresh token before it expires (90% of expiration time)
      tokenRefreshTimeout = setTimeout(
        () => {
          omogenToken = null
          tokenFetchPromise = null
        },
        validation.data.expires_in * 1000 * 0.9
      )

      return validation.data.access_token
    } catch (error: any) {
      sentryCaptureException(error, { extra: { responseData: error.response?.data } })
      throw internal("impossible d'obtenir un token pour l'API Omogen")
    } finally {
      tokenFetchPromise = null
    }
  })()

  return tokenFetchPromise
}

/**
 * Fetch InserJeune statistics for a specific certification and region
 */
export const fetchInserJeuneStats = async (zipcode: string, cfd: string) => {
  try {
    const token = await getOmogenToken()
    const { data } = await axiosClient.get(`${OMOGEN_BASE_URL}/exposition-inserjeunes-insersup/api/inserjeunes/regionales/${zipcode}/certifications/${cfd}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return data
  } catch (error: any) {
    if (error.response?.status === 404) {
      logger.info(`Pas de données InserJeune disponibles pour zipcode=${zipcode}, cfd=${cfd}`)
      return null
    }
    sentryCaptureException(error, { extra: { responseData: error.response?.data, zipcode, cfd } })
    throw internal("Erreur lors de la récupération des données InserJeune")
  }
}
