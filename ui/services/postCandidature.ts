import axios from "axios"
import _ from "lodash"

import { apiEndpoint } from "../config/config"
import { SendPlausibleEvent } from "../utils/plausible"
import { logError } from "../utils/tools"

import extractCandidatureParams from "./extractCandidatureParams"

export default async function postCandidature({ applicantValues, company_h, jobLabel, caller }) {
  let res = ""

  const candidatureApi = apiEndpoint + "/v1/application"

  let response = null
  let isAxiosError = false

  try {
    response = await axios.post(candidatureApi, extractCandidatureParams(applicantValues, company_h, jobLabel, caller))
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
      logError("Candidature API error", `Candidature API error ${response.data.error}`)
      res = response.statusText
    } else if (isSimulatedError) {
      logError("Candidature API error simulated")
      res = "simulated_error"
    } else {
      res = "unexpected_error"
    }
  } else {
    res = "ok"
  }

  return res
}
