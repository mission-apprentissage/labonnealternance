import axios from "axios"
import baseUrl from "../utils/baseUrl"
import _ from "lodash"
import { logError } from "../utils/tools"
import extractCandidatureParams from "./extractCandidatureParams"
import { SendPlausibleEvent } from "../utils/plausible"

export default async function postCandidature(applicant_h, company_h, caller, _baseUrl = baseUrl, _axios = axios, _window = window, _logError = logError) {
  let res = ""

  const candidatureApi = _baseUrl + "/api/application"

  let response = null
  let isAxiosError = false

  try {
    response = await _axios.post(candidatureApi, extractCandidatureParams(applicant_h, company_h, caller))
  } catch (error) {
    response = error.response

    if (response.status == "429") {
      SendPlausibleEvent("429 Candidature")
    }

    isAxiosError = true // les tests retournent un résultat correct avec une 500;
  }

  isAxiosError = isAxiosError || !!_.get(response, "data.error")
  const isSimulatedError = false
  const isError = isAxiosError || isSimulatedError

  if (isError) {
    if (isAxiosError) {
      _logError("Candidature API error", `Candidature API error ${response.data.error}`)
      res = response.statusText
    } else if (isSimulatedError) {
      _logError("Candidature API error simulated")
      res = "simulated_error"
    } else {
      res = "unexpected_error"
    }
  } else {
    res = "ok"
  }

  return res
}
