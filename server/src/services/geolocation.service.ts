import { internal, isBoom } from "@hapi/boom"
import { AxiosResponse } from "axios"
import { IPointFeature } from "shared/models/cacheGeolocation.model"

import { getHttpClient } from "@/common/utils/httpUtils"

import { getGeolocationFromCache, saveGeolocationInCache } from "./cacheGeolocation.service"

export interface IAPIAdresse {
  type: string
  version: string
  features: IPointFeature[]
  attribution: string
  licence: string
  query: string
  limit: number
}

export const getGeolocationFromApiAdresse = async (address: string) => {
  try {
    let response: AxiosResponse<IAPIAdresse> | null = null
    let trys = 0
    while (trys < 3) {
      response = await getHttpClient().get(`https://api-adresse.data.gouv.fr/search?q=${encodeURIComponent(address.toUpperCase())}&limit=1`)
      if (response?.status === 429) {
        console.warn("429 ", new Date())
        trys++
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } else {
        break
      }
    }
    if (response) {
      return response.data
    } else {
      return null
    }
  } catch (error: any) {
    if (isBoom(error)) {
      throw error
    }
    const newError = internal(`getGeolocationFromApiAdresse: erreur de récupération des geo coordonnées`, { address })
    newError.cause = error
    throw newError
  }
}

export const getReverseGeolocationFromApiAdresse = async (lon: number, lat: number): Promise<IPointFeature | null> => {
  try {
    let response: AxiosResponse<IAPIAdresse> | null = null
    let trys = 0
    while (trys < 3) {
      response = await getHttpClient().get(`https://api-adresse.data.gouv.fr/reverse/?lon=${lon}&lat=${lat}&type=street&limit=1`)
      if (response?.status === 429) {
        console.warn("429 ", new Date())
        trys++
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } else {
        break
      }
    }
    if (response?.data?.features?.length) {
      return response.data.features.at(0)!
    } else {
      return null
    }
  } catch (error: any) {
    if (isBoom(error)) {
      throw error
    }
    const newError = internal(`getReverseGeolocationFromApiAdresse: erreur de récupération des geo coordonnées`, { lat, lon })
    newError.cause = error
    throw newError
  }
}

export const getGeolocation = async (rawAddress: string): Promise<IPointFeature | null> => {
  try {
    const address = rawAddress.toUpperCase()

    const cachedGeolocation = await getGeolocationFromCache(address)
    if (cachedGeolocation) {
      return cachedGeolocation.features.at(0)!
    }

    const response = await getGeolocationFromApiAdresse(address)

    if (!response) {
      return null
    }

    await saveGeolocationInCache(address, response.features)

    return response.features.at(0)!
  } catch (error) {
    console.error("Error fetching or processing geolocation data:", error)
    return null
  }
}
