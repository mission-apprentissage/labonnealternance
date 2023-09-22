import axios from "axios"
import _ from "lodash"

import { baseUrl } from "../config/config"
import { logError } from "../utils/tools"

export default async function fetchTrainingDetails(training, errorCallbackFn = _.noop, _baseUrl = baseUrl, _axios = axios, _window = window, _logError = logError) {
  let res = null

  if (!training) {
    return res
  }

  const trainingsApi = `${_baseUrl}/api/v1/formations/formation/${encodeURIComponent(training.id)}`
  const lbfApi = `${_baseUrl}/api/v1/formations/formationDescription/${training.idRco}`

  const [response, lbfResponse] = await Promise.all([_axios.get(trainingsApi), _axios.get(lbfApi)])

  const isSimulatedError = _.includes(_.get(_window, "location.href", ""), "trainingDetailError=true")
  const isAxiosError = !!_.get(response, "data.error") || !!_.get(lbfResponse, "data.error")

  const isError = isAxiosError || isSimulatedError

  if (isError) {
    errorCallbackFn()
    if (isAxiosError) {
      _logError("Training detail API error", `Training detail API error ${response.data.error}`)
    } else if (isSimulatedError) {
      _logError("Training detail API error simulated with a query param :)")
    }
  } else if (response.data?.results?.length) {
    res = response.data.results[0]

    // remplacement des coordonnées de contact catalogue par celles de lbf
    const contactLbf = lbfResponse.data.organisme.contact

    res.contact = res.contact || {}
    res.contact.phone = contactLbf?.tel || res.contact.phone
    res.company.url = contactLbf?.url || res.company.url
  }

  return res
}
