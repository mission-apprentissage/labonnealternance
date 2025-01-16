import axios from "axios"

import { apiEndpoint } from "../config/config"
import memoize from "../utils/memoize"
import { SendPlausibleEvent } from "../utils/plausible"
import { isNonEmptyString, capitalizeFirstLetter } from "../utils/strutils"
import { logError } from "../utils/tools"

let cancelToken

export const fetchRomes = memoize(async (value, errorCallbackFn) => {
  let res = []

  //Check if there are any previous pending requests
  if (typeof cancelToken != typeof undefined) {
    cancelToken.cancel("Operation canceled due to new request.")
  }

  //Save the cancel token for the current request
  cancelToken = axios.CancelToken.source()

  if (!isNonEmptyString(value)) return res

  const romeApi = apiEndpoint + "/rome"

  try {
    const reqParams = { title: value }
    const response = await axios.get(romeApi, { params: reqParams, cancelToken: cancelToken.token })

    const isAxiosError = !!response?.data?.error
    const hasNoLabelsAndRomes = !response?.data?.labelsAndRomes && !response?.data?.labelsAndRomesForDiplomas

    const isError = isAxiosError || hasNoLabelsAndRomes

    if (isError) {
      errorCallbackFn()
      if (isAxiosError) {
        logError("Rome API error", `Rome API error ${response.data.error}`)
      } else if (hasNoLabelsAndRomes) {
        logError("Rome API error : API call worked, but returned unexpected data")
      }
    } else {
      // transformation des textes des diplômes
      let diplomas = []

      if (response?.data?.labelsAndRomesForDiplomas?.length) {
        diplomas = response.data.labelsAndRomesForDiplomas.map((diploma) => (diploma = { ...diploma, label: capitalizeFirstLetter(diploma.label) }))
      }

      // on affiche d'abord jusqu'à 4 métiers puis jusqu'à 4 diplômes puis le reste s'il y a
      if (response?.data?.labelsAndRomes?.length) {
        res = res.concat(response.data.labelsAndRomes.slice(0, 4))
      }
      if (diplomas.length) {
        res = res.concat(diplomas.slice(0, 4))
      }
      if (response?.data?.labelsAndRomes?.length) {
        res = res.concat(response.data.labelsAndRomes.slice(4))
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
    }
  } catch (err) {
    console.error("Fetch romes cancelled : ", err)
    return "cancelled"
  }

  return res
})
