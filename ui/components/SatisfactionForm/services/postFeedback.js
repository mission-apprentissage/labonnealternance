import axios from "axios"
import _ from "lodash"
import { getConfig } from "../../../utils/config"
import { logError } from "../../../utils/tools"

const { baseUrl } = getConfig()

export default async function postFeedback(params, _baseUrl = baseUrl, _axios = axios, _window = window, _logError = logError) {
  let res = ""

  const candidatureApi = _baseUrl + "/api/application/feedback"
  const response = await _axios.post(candidatureApi, params)

  const isAxiosError = !!_.get(response, "data.error")
  const isSimulatedError = false
  const isError = isAxiosError || isSimulatedError

  if (isError) {
    if (isAxiosError) {
      _logError("Candidature API error", `Candidature API error ${response.data.error}`)
      console.log("response", response)
    } else if (isSimulatedError) {
      _logError("Candidature API error simulated")
    }
    res = "error"
  } else {
    res = "ok"
  }

  return res
}
