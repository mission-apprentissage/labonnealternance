import { internal, isBoom } from "@hapi/boom"
import { AxiosResponse } from "axios"
import FormData from "form-data"
import { IAdresseV3, IAPIAdresse, IGeometry, IGeoPoint, IPointFeature, ZPointGeometry } from "shared/models"
import { joinNonNullStrings } from "shared/utils"

import { getHttpClient } from "@/common/utils/httpUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"

import { getGeolocationFromCache, saveGeolocationInCache } from "./cacheGeolocation.service"

const API_ADRESSE_URL = "https://api-adresse.data.gouv.fr"

export const getGeolocationFromApiAdresse = async (address: string, trys = 0) => {
  try {
    let response: AxiosResponse<IAPIAdresse> | null = null

    if (trys < 5) {
      response = await getHttpClient({ timeout: 2000 }).get(`${API_ADRESSE_URL}/search?q=${encodeURIComponent(address.toUpperCase())}&limit=1`)
      if (response?.status === 429) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return await getGeolocationFromApiAdresse(address, trys++)
      }
    }

    if (response) {
      return response.data
    } else {
      return null
    }
  } catch (error: any) {
    if (error.code === "ECONNABORTED" || error?.response?.status === 503) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return await getGeolocationFromApiAdresse(address, trys++)
    }

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
      response = await getHttpClient().get(`${API_ADRESSE_URL}/reverse/?lon=${lon}&lat=${lat}&type=municipality&limit=1`)
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

    const features = response.features
    if (features?.at(0)?.geometry) {
      features.at(0)!.geometry = convertGeometryToPoint(features.at(0)!.geometry)
    }

    try {
      await saveGeolocationInCache(address, features)
    } catch (updateCacheError) {
      sentryCaptureException(updateCacheError, { level: "warning", extra: { cause: "error saving geolocation to cache", responseData: response.features, address } })
    }

    return response.features.at(0)!
  } catch (error) {
    console.error("Error fetching or processing geolocation data:", error)
    return null
  }
}

export const getGeoPoint = async (adresse: string): Promise<IGeoPoint> => {
  try {
    const geolocation = await getGeolocation(adresse)
    if (!geolocation) {
      throw internal("getGeoPoint: addresse non trouvée", { adresse })
    }

    return ZPointGeometry.parse(geolocation.geometry)
  } catch (error: any) {
    if (isBoom(error)) {
      throw error
    }
    const newError = internal(`getGeoPoint: erreur de récupération des geo coordonnées`, { adresse })
    newError.cause = error
    throw newError
  }
}

export type GeoCoord = {
  latitude: number
  longitude: number
}

export const getGeoCoordinates = async (adresse: string): Promise<GeoCoord> => {
  const geopoint = await getGeoPoint(adresse)
  const [longitude, latitude] = geopoint.coordinates

  return { latitude, longitude }
}

export function convertGeometryToPoint(geometry: IGeometry): IGeoPoint {
  const { type } = geometry
  if (type === "Point") {
    return geometry
  } else if (type === "Polygon") {
    return {
      type: "Point",
      coordinates: geometry.coordinates[0][0],
    }
  } else {
    throw new Error(`Badly formatted geometry. type=${type}`)
  }
}

export const getCityFromProperties = (feature: IPointFeature | null) => feature?.properties?.city ?? feature?.properties?.municipality ?? feature?.properties?.locality ?? null
export const getStreetFromProperties = (feature: IPointFeature | null) => (feature?.properties?.street ? feature?.properties?.name : null)

export const addressDetailToString = (address: IAdresseV3): string => {
  const { l4 = "", l6 = "", l7 = "" } = address?.acheminement_postal ?? {}
  return [l4, l6, l7 === "FRANCE" ? null : l7].filter((_) => _).join(" ")
}

export const addressDetailToStreetLabel = (address: IAdresseV3): string | null => {
  return joinNonNullStrings([address.numero_voie, address.type_voie, address.libelle_voie])
}

export const getBulkGeoLocation = async (form: FormData) => {
  return await getHttpClient().post("https://api-adresse.data.gouv.fr/search/csv/", form, {
    headers: {
      ...form.getHeaders(),
    },
  })
}
