import axios from "axios"
import baseUrl from "../utils/baseUrl"
import _ from "lodash"
import { isNonEmptyString } from "../utils/strutils"
import { logError } from "../utils/tools"
import memoize from "../utils/memoize"

const filteredInput = (input) => {
  let res = []
  if (_.isArray(input)) {
    res = _.filter(input, (e) => isNonEmptyString(e))
  }
  return res
}

const fetchDiplomas = memoize(async (arrayOfRome, arrayOfRncp, _baseUrl = baseUrl, _axios = axios, _window = window, _logError = logError) => {
  let res = []

  let cleanedArrayOfRome = filteredInput(arrayOfRome)
  if (cleanedArrayOfRome.length === 0) return res

  let cleanedArrayOfRncp = filteredInput(arrayOfRncp)
  if (cleanedArrayOfRncp.length === 0) return res

  const romeDiplomasApi = _baseUrl + "/api/jobsdiplomas"

  let isAxiosError, hasNoValidData, isSimulatedError

  try {
    const response = await _axios.get(romeDiplomasApi, {
      params: { romes: cleanedArrayOfRome.join(","), rncps: cleanedArrayOfRncp.join(",") },
    })

    isAxiosError = !!_.get(response, "data.error")
    hasNoValidData = !_.isArray(_.get(response, "data"))
    isSimulatedError = _.includes(_.get(_window, "location.href", ""), "diplomaError=true")

    res = response.data
  } catch (err) {
    isAxiosError = err.message
  }

  const isError = isAxiosError || hasNoValidData || isSimulatedError

  if (isError) {
    if (isAxiosError) {
      _logError("Diploma API error", `Diploma API error`)
    } else if (hasNoValidData) {
      _logError("Diploma API error : API call worked, but returned unexpected data")
    } else if (isSimulatedError) {
      _logError("Diploma API error simulated with a query param :)")
    }

    res = []
  }

  return res
})

export default fetchDiplomas
