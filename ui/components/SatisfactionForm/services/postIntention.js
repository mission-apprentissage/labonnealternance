import axios from "axios"
import _ from "lodash"
import { logError } from "../../../utils/tools"
import { baseUrl } from "../../../config/config"

export default async function postIntention(params, _baseUrl = baseUrl, _axios = axios, _window = window, _logError = logError) {
  let res = ""

  const candidatureApi = _baseUrl + "/api/application/intention"
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
