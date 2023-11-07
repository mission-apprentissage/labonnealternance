import axios from "axios"
import _ from "lodash"

import { apiEndpoint } from "../config/config"
import { logError } from "../utils/tools"

export default async function fetchTrainingDetails(training, errorCallbackFn = _.noop, _apiEndpoint = apiEndpoint, _axios = axios, _window = window, _logError = logError) {
  let res = null

  if (!training) {
    return res
  }

  const trainingsApi = `${_apiEndpoint}/v1/formations/formation/${encodeURIComponent(training.id)}`

  const response = await _axios.get(trainingsApi)

  const isSimulatedError = _.includes(_.get(_window, "location.href", ""), "trainingDetailError=true")
  const isAxiosError = !!_.get(response, "data.error")

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
  }

  return res
}
