import { internal, isBoom } from "@hapi/boom"
import { AxiosResponse } from "axios"
import { ObjectId } from "mongodb"
import { IPointFeature } from "shared/models/cacheGeolocation.model"

import { getHttpClient } from "@/common/utils/httpUtils"

import { getDbCollection } from "../common/utils/mongodbUtils"

const getGeolocationFromCache = async (address: string) => {
  return await getDbCollection("cache_geolocation").findOne({ address })
}

export interface IAPIAdresse {
  type: string
  version: string
  features: IPointFeature[]
  attribution: string
  licence: string
  query: string
  limit: number
}

const getGeolocationFromApiAdresse = async (address: string) => {
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
    const newError = internal(`getGeoFeature: erreur de récupération des geo coordonnées`, { address })
    newError.cause = error
    throw newError
  }
}

export const getGeolocation = async (rawAddress: string): Promise<IPointFeature | null> => {
  try {
    const address = rawAddress.toUpperCase()

    const cachedGeolocation = await getGeolocationFromCache(address)
    if (cachedGeolocation) {
      //console.log("trouvé dans cache")
      return cachedGeolocation.features.at(0)!
    }

    //console.log("getgeo ", address)

    const response = await getGeolocationFromApiAdresse(address)

    if (!response) {
      return null
    }

    //console.log("trouvé dans api ")
    await getDbCollection("cache_geolocation").updateOne(
      { address },
      {
        $set: {
          features: response.features,
          address,
        },
        $setOnInsert: {
          _id: new ObjectId(),
        },
      },
      { upsert: true }
    )

    return response.features.at(0)!
  } catch (error) {
    console.error("Error fetching or processing geolocation data:", error)
    return null
  }
}
