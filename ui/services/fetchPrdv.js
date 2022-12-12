import axios from "axios"
import _ from "lodash"
import baseUrl from "../utils/baseUrl.js"
import { logError } from "../utils/tools.js"

/**
 * @description Returns "RDV" link.
 * @param training
 * @param hasAlsoJob
 * @param _axios
 * @param _window
 * @param _logError
 * @returns {Promise<{error: string}|null>}
 */
export default async function fetchPrdv(training, hasAlsoJob, _axios = axios, _window = window, _logError = logError) {
  let res = null

  const rdvUrl = `${baseUrl}/api/appointment-request/context/create`

  if (!training) {
    return null
  }

  const response = await _axios.post(
    rdvUrl,
    {
      referrer: "lba",
      idCleMinistereEducatif: training.id,
      trainingHasJob: !!hasAlsoJob,
    },
    { headers: { "Content-Type": "application/json" } }
  )

  if (response?.data?.error === "Prise de rendez-vous non disponible.") {
    return { error: "indisponible" }
  }

  const isAxiosError = !!_.get(response, "data.error")
  const isSimulatedError = _.includes(_.get(_window, "location.href", ""), "romeError=true")

  const isError = isAxiosError || isSimulatedError

  if (isError) {
    if (isAxiosError) {
      _logError("PRDV API error", `Rome API error ${response.data.error}`)
    } else if (isSimulatedError) {
      _logError("PRDV API error simulated with a query param :)")
    }
  } else {
    // transformation des textes des diplômes
    res = response.data
  }

  return res
}
