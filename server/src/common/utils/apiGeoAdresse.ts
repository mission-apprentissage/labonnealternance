import { logger } from "../logger"

import { getHttpClient } from "./httpUtils"

// Cf Documentation : https://geo.api.gouv.fr/adresse
const apiEndpoint = "https://api-adresse.data.gouv.fr"

interface IGeoAddress {
  type: string
  version: string
  features: IFeature[]
  attribution: string
  licence: string
  query: string
  limit: number
}

interface IFeature {
  type: string
  geometry: IGeometry
  properties: IProperties
}

interface IGeometry {
  type: string
  coordinates: number[]
}

interface IProperties {
  label: string
  score: number
  housenumber: string
  id: string
  type: string
  name: string
  postcode: string
  citycode: string
  x: number
  y: number
  city: string
  context: string
  importance: number
  street: string
}

class ApiGeoAdresse {
  constructor() {}

  async search(q, postcode = null) {
    try {
      if (!q) {
        throw new Error("missing mandatory query")
      }
      const query = `${apiEndpoint}/search/?q=${q}${postcode ? `&postcode=${postcode}` : ""}`
      const response = await this.searchQuery(query)

      return response
    } catch (error) {
      logger.error(`geo search error : ${q} ${postcode} ${error}`)
      return null
    }
  }

  async searchQuery(query): Promise<IGeoAddress | null> {
    let response
    let trys = 0

    while (trys < 3) {
      response = await getHttpClient().get<IGeoAddress>(query)

      if (response?.data?.status === 429) {
        console.warn("429 ", new Date(), query)
        trys++
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } else {
        break
      }
    }

    return response?.data
  }

  async searchPostcodeOnly(postcode: string) {
    try {
      const response = await getHttpClient().get<IGeoAddress>(`${apiEndpoint}/search/?q=${postcode}&postcode=${postcode}`)
      return response.data
    } catch (error) {
      logger.error(`geo searchPostcodeOnly error : ${postcode} ${error}`)
      return null
    }
  }
}

const apiGeoAdresse = new ApiGeoAdresse()
export default apiGeoAdresse
