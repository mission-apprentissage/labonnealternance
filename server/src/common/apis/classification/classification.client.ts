import { internal } from "@hapi/boom"
import {
  IClassificationLabResponse,
  IClassificationLabVersionResponse,
  ZClassificationLabResponse,
  ZClassificationLabVersionResponse,
} from "shared/models/cacheClassification.model"

import getApiClient from "@/common/apis/client"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import config from "@/config"

const client = getApiClient({ baseURL: config.labonnealternanceLab.baseUrl })

export const getLabClassification = async (job: string): Promise<IClassificationLabResponse> => {
  try {
    const response = await client.post("/score", { text: job })
    const validation = ZClassificationLabResponse.safeParse(response.data)
    if (!validation.success) {
      throw internal("getLabClassification: format de réponse non valide", { error: validation.error })
    }
    return validation.data
  } catch (error: any) {
    sentryCaptureException(error, { extra: { responseData: error.response?.data } })
    throw internal("getLabClassification: erreur lors de la récupération des données", { error })
  }
}

export const getLabClassificationModelVersion = async (): Promise<IClassificationLabVersionResponse> => {
  try {
    const response = await client.get("/version")
    const validation = ZClassificationLabVersionResponse.safeParse(response.data)
    if (!validation.success) {
      throw internal("getLabClassificationModelVersion: format de réponse non valide", { error: validation.error })
    }
    return validation.data
  } catch (error: any) {
    sentryCaptureException(error, { extra: { responseData: error.response?.data } })
    throw internal("getLabClassificationModelVersion: erreur lors de la récupération des données", { error })
  }
}
