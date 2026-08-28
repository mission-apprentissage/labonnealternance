import { internal } from "@hapi/boom"
import type { IDiagorienteClassificationResponseSchema, IDiagorienteClassificationSchema } from "shared"
import { ZDiagorienteClassificationResponseSchema } from "shared"
import { z } from "zod"

import getApiClient from "@/common/apis/client"
import { logger } from "@/common/logger"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import config from "@/config"

export const MAX_DIAGORIENTE_PAYLOAD_SIZE = 100
export const DIAGORIENTE_AS_OF_DATE = "2026-01-01"

const authParams = {
  url: config.diagoriente.authUrl,
  client_id: config.diagoriente.clientId,
  client_secret: config.diagoriente.clientSecret,
  grant_type: "client_credentials",
}

const ZDiagorienteAuthApi = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  refresh_expires_in: z.number(),
  token_type: z.string(),
  "not-before-policy": z.number(),
  scope: z.string(),
})
type IAuthParams = typeof authParams

const axiosClient = getApiClient({})

let diagorienteToken: string | null = null

const getDiagorienteToken = async (access: IAuthParams): Promise<string> => {
  if (diagorienteToken) return diagorienteToken
  try {
    logger.info(`Récupération du token pour l'API Diagoriente`)
    const requestBody = { client_id: access.client_id, client_secret: access.client_secret, grant_type: access.grant_type }
    const { data } = await axiosClient.post(`${access.url}`, requestBody, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })

    const validation = ZDiagorienteAuthApi.safeParse(data)
    if (!validation.success) {
      throw internal("Format de retour de l'api d'authentification diagoriente non valide", { error: validation.error })
    }

    diagorienteToken = validation.data.access_token
    setTimeout(() => {
      diagorienteToken = null
    }, validation.data.expires_in * 1000)
    return validation.data.access_token
  } catch (error: any) {
    // Erreur dédiée plutôt que l'AxiosError brut : celui-ci porte `config.data` (le client_id/
    // client_secret envoyés en corps de requête), que extraErrorDataIntegration sérialiserait
    // tel quel dans Sentry (sendDefaultPii actif).
    sentryCaptureException(new Error(`diagoriente: échec d'obtention du token (${error.message ?? "erreur inconnue"})`), {
      extra: { status: error.response?.status, responseData: error.response?.data },
    })
    throw internal("impossible d'obtenir un token pour l'API Diagoriente")
  }
}
export const getDiagorienteRomeClassification = async (data: IDiagorienteClassificationSchema[]): Promise<IDiagorienteClassificationResponseSchema> => {
  if (data.length > 100) throw internal("Trop de données à envoyer à l'API Diagoriente, limiter la requête à 100 éléments")
  const token = await getDiagorienteToken(authParams)
  let responseData: unknown
  try {
    const apiResponse = await axiosClient.post("https://semafor.diagoriente.fr/classify/SousDomaines", data, {
      timeout: 70_000,
      headers: { Authorization: `Bearer ${token}` },
      params: { as_of: DIAGORIENTE_AS_OF_DATE },
    })
    responseData = apiResponse.data
  } catch (error: any) {
    // Erreur dédiée plutôt que l'AxiosError brut, qui porte `config.headers.Authorization` (le
    // Bearer token) : par cohérence avec getDiagorienteToken ci-dessus, et pour ne pas dépendre
    // du comportement de l'appelant (aujourd'hui fillRomeForPartners avale l'erreur dans un Error
    // générique avant tout appel Sentry, mais rien ne garantit qu'un futur appelant fasse de même).
    sentryCaptureException(new Error(`diagoriente: échec de classification (${error.message ?? "erreur inconnue"})`), {
      extra: { status: error.response?.status, responseData: error.response?.data },
    })
    throw internal("impossible d'obtenir une classification depuis l'API Diagoriente")
  }
  const validation = ZDiagorienteClassificationResponseSchema.safeParse(responseData)
  if (!validation.success) throw internal("getRomeClassificationFromDiagoriente: format de réponse non valide", { error: validation.error })
  return validation.data
}
