import axios from "axios"
import _ from "lodash"
import { baseUrl, inserJeuneApiUrl } from "../config/config"
import { logError } from "../utils/tools"

export default async function fetchInserJeuneStats(training, _baseUrl = baseUrl, _axios = axios, _window = window, _logError = logError) {
  let res = null

  if (!training) {
    return res
  }
  const response = await _axios.get(`${inserJeuneApiUrl}/api/inserjeunes/regionales/${training.place.zipCode}/certifications/${training.cfd}`)

  const isAxiosError = !!_.get(response, "data.error")

  if (isAxiosError) {
    _logError("InserJeune API error", `InserJeune API error ${response.data.error}`)
  } else {
    res = response.data
  }

  return res
}
