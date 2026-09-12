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
    postcode?: string | string[]
    citycode?: string | string[]
    population?: number
    toponym?: string
    category?: string[]
    _type?: "address" | "poi"
  }
  geometry: IPointGeometry
}

/**
 * Catégories `poi` retenues comme emprise de recherche, leur nom côté API LBA et leur rang
 * d'affichage : la région avant le département, tous deux avant les communes.
 */
const ADMIN_CATEGORIES: Record<string, { kind: "region" | "departement"; rank: number }> = {
  région: { kind: "region", rank: 0 },
  département: { kind: "departement", rank: 1 },
}
const COMMUNE_RANK = 2

/**
 * Seules catégories demandées à l'index `poi`. `type=municipality` ne filtre que l'index
 * `address` : sans cette restriction, `poi` remplissait les 10 places avec tout ce qui porte le
 * nom saisi (hameaux, arrêt de tram « Bretagne » à Nantes, forêt…) et plus aucune commune de
 * l'index `address` ne passait. Les communes restent servies par `address`, dans leur format
 * historique : pas de doublon, pas d'EPCI sans code, arrondissements déjà couverts (75115…).
 */
const POI_CATEGORIES = "département,région"

const firstOf = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value)

/**
 * Guadeloupe, Martinique, Guyane, La Réunion, Mayotte : la région et le département portent le
 * même nom et couvrent le même territoire. Proposer les deux, c'est deux lignes « Guadeloupe »
 * pour un seul choix. On garde le département, dont le code (971…) est celui que tout le monde
 * connaît ; le filtre renvoie exactement les mêmes résultats.
 */
const dedupeSingleDepartmentRegions = (items: IAddressItem[]): IAddressItem[] => {
  const departementLabels = new Set(items.filter((i) => i.adminArea?.startsWith("departement:")).map((i) => i.label))
  return items.filter((i) => !(i.adminArea?.startsWith("region:") && departementLabels.has(i.label)))
}

const adminRank = (feature: AddressFeature): number => (feature.properties.category && ADMIN_CATEGORIES[feature.properties.category[1]]?.rank) ?? COMMUNE_RANK

type Coordinates = [number, number]

type IAddressItem = {
  value: IPointGeometry
  insee: string
  zipcode: string
  label: string
  /** `"region:53"` / `"departement:44"` : renseigné uniquement pour une entité supra-communale. */
  adminArea?: string
  /**
   * Libellé de la liste de suggestions quand il diffère du libellé appliqué : « Bretagne (région) »
   * dans la liste, « Bretagne » dans le champ, l'URL et le H1.
   */
  displayLabel?: string
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
    // `category` ne s'applique qu'à `poi` : l'index `address` reste entier (communes, rues, numéros).
    const index = withAdminAreas ? `&index=address,poi&category=${encodeURIComponent(POI_CATEGORIES)}` : ""
    const addressURL = `https://data.geopf.fr/geocodage/search/?limit=${limit}&q=${term}${filter}${index}`

    try {
      const response = await fetch(addressURL, { signal })
      if (!response.ok) throw new Error("Network response was not ok")

      const data: { features: AddressFeature[] } = await response.json()
      data.features.sort((a, b) => {
        // Région, puis département, puis le reste : une entité que l'API score à 1 ne doit pas
        // passer derrière une commune de 200 habitants parce qu'elle n'a pas de population.
        const rank = adminRank(a) - adminRank(b)
        if (rank !== 0) return rank
        if (a.properties.population && b.properties.population) return b.properties.population - a.properties.population
        else if (a.properties.population) return -1
        else if (b.properties.population) return 1
        else return 0
      })

      const returnedItems = data.features.map((feature): IAddressItem => {
        const { label: addressLabel, citycode, toponym, category } = feature.properties
        // Sur `poi`, `postcode` et `citycode` sont des tableaux : sans ce premier élément, le
        // libellé sérialisait le tableau (« Bretagne 76200,76370 »). `citycode` porte le code
        // commune sur `address`, et le code département ou région sur `poi` : l'API n'expose pas
        // de champ `code` dédié.
        const postcode = firstOf(feature.properties.postcode)
        const code = firstOf(citycode)
        const adminCategory = category?.[1]
        const admin = adminCategory ? ADMIN_CATEGORIES[adminCategory] : undefined

        let label = addressLabel ?? toponym ?? ""
        // Une entité supra-communale n'a pas de code postal : concaténer produirait
        // "Bretagne undefined".
        if (postcode && label.indexOf(postcode) < 0) label += " " + postcode

        return {
          value: feature.geometry,
          insee: code ?? "",
          zipcode: postcode ?? "",
          label,
          ...(admin && code ? { adminArea: `${admin.kind}:${code}`, displayLabel: `${label} (${adminCategory})` } : {}),
        }
      })

      return simplifiedItems(dedupeSingleDepartmentRegions(returnedItems))
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
      zipcode: firstOf(feature.properties.postcode) ?? "",
      label: feature.properties.label ?? feature.properties.toponym ?? "",
    }))

    return returnedItems
  } catch (err) {
    console.error("Fetch address from coordinates failed: ", err)
    return []
  }
}
