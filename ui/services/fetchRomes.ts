import { apiGet } from "../utils/api.utils"
import memoize from "../utils/memoize"
import { SendPlausibleEvent } from "../utils/plausible"
import { capitalizeFirstLetter, isNonEmptyString } from "../utils/strutils"

type IFetchRomes = ((value: string, errorCallbackFn?: () => void) => Promise<any>) & { abortController?: AbortController | null }

export const fetchRomes: IFetchRomes = memoize(async (value, errorCallbackFn) => {
  if (fetchRomes.abortController) {
    fetchRomes.abortController.abort()
  }
  fetchRomes.abortController = new AbortController()
  const { signal } = fetchRomes.abortController
  let res = []

  if (!isNonEmptyString(value)) return res

  const reqParams = { title: value }
  try {
    const response = await apiGet("/rome", { querystring: reqParams }, { signal })
    if (!response.labelsAndRomes && !response.labelsAndRomesForDiplomas) return []

    // transformation des textes des diplômes
    let diplomas = []

    if (response.labelsAndRomesForDiplomas?.length) {
      diplomas = response.labelsAndRomesForDiplomas.map((diploma: any) => (diploma = { ...diploma, label: capitalizeFirstLetter(diploma.label) }))
    }

    // on affiche d'abord jusqu'à 4 métiers puis jusqu'à 4 diplômes puis le reste s'il y a
    if (response.labelsAndRomes?.length) {
      res = res.concat(response.labelsAndRomes.slice(0, 4))
    }
    if (diplomas.length) {
      res = res.concat(diplomas.slice(0, 4))
    }
    if (response.labelsAndRomes?.length) {
      res = res.concat(response.labelsAndRomes.slice(4))
    }
    if (diplomas.length) {
      res = res.concat(diplomas.slice(4))
    }

    // tracking des recherches sur table domaines métier que lorsque le mot recherché fait au moins trois caractères
    if (value.length > 2) {
      if (res.length) {
        SendPlausibleEvent("Mots clefs les plus recherchés", { terme: `${value.toLowerCase()} - ${res.length}` })
      } else {
        SendPlausibleEvent("Mots clefs ne retournant aucun résultat", { terme: value.toLowerCase() })
      }
    }
    return res
  } catch (error) {
    errorCallbackFn()
    console.error("Error fetching romes from api : ", error)
    return []
  }
})
