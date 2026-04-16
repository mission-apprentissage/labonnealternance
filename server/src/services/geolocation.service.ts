import { internal, isBoom } from "@hapi/boom"
import type { AxiosResponse } from "axios"
import type FormData from "form-data"
import type { IAdresseV3, IAPIAdresse, IGeometry, IGeoPoint, IPointFeature } from "shared/models/index"
import { ZPointFeature, ZPointGeometry } from "shared/models/index"
import { joinNonNullStrings } from "shared/utils/index"
import z from "zod"
import getApiClient from "@/common/apis/client"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { getGeolocationFromCache, saveGeolocationInCache } from "./cacheGeolocation.service"

export const API_ADRESSE_URL = "https://data.geopf.fr/geocodage"

const client = getApiClient({ timeout: 2_000 })
const startCharRegex = () => new RegExp("[0-9a-zA-Z]")

async function reliableFetch({ maxTry = 5, url, currentTryIndex = 1 }: { maxTry?: number; url: string; currentTryIndex?: number }): Promise<IAPIAdresse | null> {
  if (currentTryIndex > maxTry) {
    return null
  }
  try {
    const response: AxiosResponse<IAPIAdresse> | null = await client.get(url)
    if (response?.status === 429) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return reliableFetch({ maxTry, url, currentTryIndex: currentTryIndex + 1 })
    }
    return response?.data ?? null
  } catch (error: any) {
    if (error.code === "ECONNABORTED" || error?.response?.status === 503) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return reliableFetch({ maxTry, url, currentTryIndex: currentTryIndex + 1 })
    }
    throw error
  }
}

export const getGeolocationFromApiAdresse = async (address: string) => {
  try {
    let firstChar = address.at(0)
    while (firstChar && !startCharRegex().test(firstChar)) {
      address = address.substring(1)
      firstChar = address.at(0)
    }
    if (!address) {
      return null
    }
    return reliableFetch({ url: `${API_ADRESSE_URL}/search?q=${encodeURIComponent(address.toUpperCase())}&limit=1` })
  } catch (error: any) {
    if (isBoom(error)) {
      throw error
    }
    const newError = internal(`getGeolocationFromApiAdresse: erreur de récupération des geo coordonnées`, { address })
    newError.cause = error
    throw newError
  }
}

export const _getReverseGeolocationFromApiAdresse = async (lon: number, lat: number): Promise<IPointFeature | null> => {
  try {
    let response: AxiosResponse<IAPIAdresse> | null = null
    let trys = 0
    while (trys < 3) {
      response = await client.get(`${API_ADRESSE_URL}/reverse/?lon=${lon}&lat=${lat}&type=municipality&limit=1`)
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

const ZApiGeolocationResponse = z.object({
  features: z.array(ZPointFeature),
})

export const getGeolocation = async (rawAddress: string): Promise<IPointFeature | null> => {
  try {
    const address = rawAddress.toUpperCase()

    const cachedGeolocation = await getGeolocationFromCache(address)
    if (cachedGeolocation) {
      return cachedGeolocation.features.at(0) ?? null
    }

    const response = await getGeolocationFromApiAdresse(address)

    const parseResult = ZApiGeolocationResponse.safeParse(response)
    if (!parseResult.success) {
      console.error("error parsing geolocation api response", { address: rawAddress, error: parseResult.error })
      return null
    }

    const features = parseResult.data.features
    const firstFeature = features.at(0)
    if (!firstFeature) {
      return null
    }
    firstFeature.geometry = convertGeometryToPoint(firstFeature.geometry)

    try {
      await saveGeolocationInCache(address, features)
    } catch (updateCacheError) {
      sentryCaptureException(updateCacheError, {
        level: "warning",
        extra: {
          cause: "error saving geolocation to cache",
          responseData: features,
          address,
        },
      })
    }

    return firstFeature
  } catch (error) {
    console.error("Error fetching or processing geolocation data:", { address: rawAddress, error })
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
  return await client.post("https://data.geopf.fr/geocodage/search/csv/", form, {
    headers: {
      ...form.getHeaders(),
    },
  })
}

export const getGeolocationFromCodeInsee = async (city: string, codeInsee: string) => {
  try {
    codeInsee = codeInsee.padStart(5, "0")
    const url = `${API_ADRESSE_URL}/search?q=${encodeURIComponent(city)}&citycode=${encodeURIComponent(codeInsee)}&limit=1`
    return reliableFetch({ url })
  } catch (error: any) {
    const newError = internal(`getGeolocationFromCodeInsee: erreur`, { city, codeInsee })
    newError.cause = error
    throw newError
  }
}
