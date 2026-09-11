// Import type-only (effacé à la compilation) : ce service part dans le bundle de la
// home (autocomplete du SearchBar) — aucun runtime zod/shared ne doit y entrer, les
// réponses de la BAN sont typées par assertion et jamais validées ici.
import type { IPointGeometry } from "shared/models/address.model"

import { simplifiedItems } from "./arrondissements"

type AddressFeature = {
  properties: {
    // Présents sur l'index `address` uniquement. L'index `poi` renvoie `toponym` et
    // `category` à la place, sans `label` ni `postcode` (cf. ban-plateforme#781) : tout
    // accès direct à `label` plante sur une feature poi.
    label?: string
    postcode?: string
    citycode?: string | string[]
    population?: number
    toponym?: string
    category?: string[]
    _type?: "address" | "poi"
  }
  geometry: IPointGeometry
}

/** Catégories `poi` retenues comme emprise de recherche, et leur nom côté API LBA. */
const ADMIN_CATEGORIES: Record<string, "region" | "departement"> = {
  région: "region",
  département: "departement",
}

type Coordinates = [number, number]

type IAddressItem = {
  value: IPointGeometry
  insee: string
  zipcode: string
  label: string
  /** `"region:53"` / `"departement:44"` : renseigné uniquement pour une entité supra-communale. */
  adminArea?: string
}

/**
 * `withAdminAreas` ajoute l'index `poi` à la requête : les départements et régions remontent
 * alors dans les suggestions, avec leur code dans `adminArea`. Opt-in tant que le filtrage
 * par emprise n'est pas généralisé côté API.
 */
export async function searchAddress(value: string, type?: string, signal?: AbortSignal, withAdminAreas = false): Promise<IAddressItem[]> {
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

    // `index=address,poi` : un seul appel, les deux index scorés ensemble par le service.
    const index = withAdminAreas ? "&index=address,poi" : ""
    const addressURL = `https://data.geopf.fr/geocodage/search/?limit=${limit}&q=${term}${filter}${index}`

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
        const { label: addressLabel, postcode, citycode, toponym, category } = feature.properties
        // `citycode` porte le code commune sur l'index address, et le code département ou
        // région sur l'index poi : l'API n'expose pas de champ `code` dédié.
        const code = Array.isArray(citycode) ? citycode[0] : citycode
        const adminKind = category ? ADMIN_CATEGORIES[category[1]] : undefined

        let label = addressLabel ?? toponym ?? ""
        // Une entité supra-communale n'a pas de code postal : concaténer produirait
        // "Bretagne undefined".
        if (postcode && label.indexOf(postcode) < 0) label += " " + postcode

        return {
          value: feature.geometry,
          insee: code ?? "",
          zipcode: postcode ?? "",
          label,
          ...(adminKind && code ? { adminArea: `${adminKind}:${code}` } : {}),
        }
      })

      return simplifiedItems(returnedItems)
    } catch (err) {
      // Requête supplantée par une saisie plus récente (React Query annule via signal à chaque
      // frappe) : flux normal de l'autocomplétion, pas une erreur à faire remonter.
      if (signal?.aborted) return []
      console.error("Fetch addresses failed : ", err)
      return []
    }
  } else return []
}

export const fetchAddressFromCoordinates = async (coordinates: Coordinates, type?: string, signal?: AbortSignal): Promise<IAddressItem[]> => {
  const addressURL = `https://data.geopf.fr/geocodage/reverse/?lat=${coordinates[1]}&lon=${coordinates[0]}${type ? "&type=" + type : ""}`

  try {
    const response = await fetch(addressURL, { signal })
    if (!response.ok) throw new Error("Network response was not ok")

    const data: { features: AddressFeature[] } = await response.json()
    const returnedItems: IAddressItem[] = data.features.map((feature) => ({
      value: feature.geometry,
      insee: (Array.isArray(feature.properties.citycode) ? feature.properties.citycode[0] : feature.properties.citycode) ?? "",
      zipcode: feature.properties.postcode ?? "",
      label: feature.properties.label ?? feature.properties.toponym ?? "",
    }))

    return returnedItems
  } catch (err) {
    console.error("Fetch address from coordinates failed: ", err)
    return []
  }
}
