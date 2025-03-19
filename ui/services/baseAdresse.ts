import { IPointGeometry, ZPointGeometry } from "shared"
import { z } from "zod"

import memoize from "../utils/memoize"

import { simplifiedItems } from "./arrondissements"

type IFetchAddresses = ((value: string, type?: string) => Promise<IAddressItem[]>) & { abortController?: AbortController | null }
type AddressFeature = {
  properties: {
    label: string
    postcode: string
    citycode: string
    population?: number
  }
  geometry: IPointGeometry
}

type Coordinates = [number, number]

export const zAddressItem = z.object({
  value: ZPointGeometry,
  insee: z.string(),
  zipcode: z.string(),
  label: z.string(),
})

type IAddressItem = z.output<typeof zAddressItem>

export async function searchAddress(value: string, type?: string, signal?: AbortSignal): Promise<IAddressItem[]> {
  if (value && value.length > 2) {
    let term = value
    const limit = 10
    let filter = ""

    if (term.length < 6) {
      // sur courte recherche on ne demande que des villes
      if (!type) filter = "&type=municipality"

      if (!isNaN(Number(term))) {
        // si le début est un nombre on complète à 5 chiffes avec des 0 pour rechercher sur un CP
        const zipLengthDiff = 5 - term.length
        for (let i = 0; i < zipLengthDiff; ++i) term += "0"
      }
    }
    if (type) filter = "&type=" + type

    const addressURL = `https://api-adresse.data.gouv.fr/search/?limit=${limit}&q=${term}${filter}`

    try {
      const response = await fetch(addressURL, { signal })
      if (!response.ok) throw new Error("Network response was not ok")

      const data: { features: AddressFeature[] } = await response.json()
      data.features.sort((a, b) => {
        if (a.properties.population && b.properties.population) return b.properties.population - a.properties.population
        else if (a.properties.population) return -1
        else if (b.properties.population) return 1
        else return 0
      })

      const returnedItems = data.features.map((feature) => {
        let label = feature.properties.label
        if (label.indexOf(feature.properties.postcode) < 0) label += " " + feature.properties.postcode

        return {
          value: feature.geometry,
          insee: feature.properties.citycode,
          zipcode: feature.properties.postcode,
          label,
        }
      })

      return simplifiedItems(returnedItems)
    } catch (err) {
      console.error("Fetch addresses cancelled : ", err)
      return []
    }
  } else return []
}

export const fetchAddresses: IFetchAddresses = memoize(async (value: string, type?: string) => {
  if (fetchAddresses.abortController) {
    fetchAddresses.abortController.abort()
  }

  fetchAddresses.abortController = new AbortController()
  const { signal } = fetchAddresses.abortController

  return searchAddress(value, type, signal)
})

export const fetchAddressFromCoordinates = async (coordinates: Coordinates, type?: string, signal?: AbortSignal): Promise<IAddressItem[]> => {
  const addressURL = `https://api-adresse.data.gouv.fr/reverse/?lat=${coordinates[1]}&lon=${coordinates[0]}${type ? "&type=" + type : ""}`

  try {
    const response = await fetch(addressURL, { signal })
    if (!response.ok) throw new Error("Network response was not ok")

    const data: { features: AddressFeature[] } = await response.json()
    const returnedItems: IAddressItem[] = data.features.map((feature) => ({
      value: feature.geometry,
      insee: feature.properties.citycode,
      zipcode: feature.properties.postcode,
      label: feature.properties.label,
    }))

    return returnedItems
  } catch (err) {
    console.error("Fetch address from coordinates failed: ", err)
    return []
  }
}
