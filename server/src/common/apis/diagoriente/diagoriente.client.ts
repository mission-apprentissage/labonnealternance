import { internal } from "@hapi/boom"
import type { IDiagorienteClassificationResponseSchema, IDiagorienteClassificationSchema } from "shared"
import { ZDiagorienteClassificationResponseSchema } from "shared"
import { z } from "zod"

import getApiClient from "@/common/apis/client"
import { logger } from "@/common/logger"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import config from "@/config"

export const MAX_DIAGORIENTE_PAYLOAD_SIZE = 100

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
    sentryCaptureException(error, { extra: { responseData: error.response?.data } })
    throw internal("impossible d'obtenir un token pour l'API Diagoriente")
  }
}
export const getDiagorienteRomeClassification = async (data: IDiagorienteClassificationSchema[]): Promise<IDiagorienteClassificationResponseSchema> => {
  if (data.length > 100) throw internal("Trop de données à envoyer à l'API Diagoriente, limiter la requête à 100 éléments")
  const token = await getDiagorienteToken(authParams)
  const { data: response } = await axiosClient.post("https://semafor.diagoriente.fr/classify/SousDomaines", data, {
    timeout: 70_000,
    headers: { Authorization: `Bearer ${token}` },
  })
  const validation = ZDiagorienteClassificationResponseSchema.safeParse(response)
  if (!validation.success) throw internal("getRomeClassificationFromDiagoriente: format de réponse non valide", { error: validation.error })
  return validation.data
}
