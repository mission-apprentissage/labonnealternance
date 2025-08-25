import { internal } from "@hapi/boom"
import {
  IClassificationLabBatchResponse,
  IClassificationLabResponse,
  IClassificationLabVersionResponse,
  ZClassificationLabBatchResponse,
  ZClassificationLabResponse,
  ZClassificationLabVersionResponse,
} from "shared/models/cacheClassification.model"

import getApiClient from "@/common/apis/client"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import config from "@/config"

const client = getApiClient({ baseURL: config.labonnealternanceLab.baseUrl })
// const client = getApiClient({ baseURL: "http://localhost:8000" })

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
    throw error
  }
}

export type IGetLabClassificationBatch = {
  id: string
  text: string
}[]

export const getLabClassificationBatch = async (jobs: IGetLabClassificationBatch): Promise<IClassificationLabBatchResponse> => {
  try {
    const response = await client.post("/scores", { items: jobs }, { timeout: 30_000 })
    const validation = ZClassificationLabBatchResponse.safeParse(response.data)
    if (!validation.success) {
      throw internal("getLabClassificationBatch: format de réponse non valide", { error: validation.error })
    }
    return validation.data
  } catch (error: any) {
    console.error(error)
    sentryCaptureException(error, { extra: { responseData: error.response?.data } })
    throw error
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
    throw error
  }
}
