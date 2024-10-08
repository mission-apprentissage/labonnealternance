import axios from "axios"
import _ from "lodash"

import { publicConfig } from "../config.public"
import { logError } from "../utils/tools"

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
  if (!training) {
    return null
  }

  const rdvUrl = `${publicConfig.apiEndpoint}/appointment-request/context/create`

  try {
    const response = await _axios.post(
      rdvUrl,
      {
        referrer: "lba",
        idCleMinistereEducatif: training.id,
        trainingHasJob: !!hasAlsoJob,
      },
      { headers: { "Content-Type": "application/json" } }
    )

    return response.data
  } catch (error) {
    if (error?.response?.data?.error === "Prise de rendez-vous non disponible." || error?.response?.data?.message === "Formation introuvable") {
      return { error: "indisponible" }
    }

    const isSimulatedError = _.includes(_.get(_window, "location.href", ""), "romeError=true")

    if (isSimulatedError) {
      _logError("PRDV API error simulated with a query param :)")
    }

    return error.response
  }
}
