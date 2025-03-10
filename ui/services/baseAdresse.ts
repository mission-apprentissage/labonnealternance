import memoize from "../utils/memoize"

import { simplifiedItems } from "./arrondissements"

type IFetchAddresses = ((value: string, type?: string) => Promise<any>) & { abortController?: AbortController | null }
type AddressFeature = {
  properties: {
    label: string
    postcode: string
    citycode: string
    population?: number
  }
  geometry: any
}
type Coordinates = [number, number]
type AddressItem = {
  insee: string
  zipcode: string
  label: string
}

export const fetchAddresses: IFetchAddresses = memoize(async (value: string, type?: string) => {
  if (fetchAddresses.abortController) {
    fetchAddresses.abortController.abort()
  }

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

    fetchAddresses.abortController = new AbortController()
    const { signal } = fetchAddresses.abortController

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
})

export const fetchAddressFromCoordinates = async (coordinates: Coordinates, type?: string): Promise<AddressItem[]> => {
  const addressURL = `https://api-adresse.data.gouv.fr/reverse/?lat=${coordinates[1]}&lon=${coordinates[0]}${type ? "&type=" + type : ""}`

  try {
    const response = await fetch(addressURL)
    if (!response.ok) throw new Error("Network response was not ok")

    const data: { features: { properties: { citycode: string; postcode: string; label: string } }[] } = await response.json()
    const returnedItems: AddressItem[] = data.features.map((feature) => ({
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
