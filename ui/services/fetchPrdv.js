import axios from "axios"
import env from "../utils/env"
import _ from "lodash"
import { logError } from "../utils/tools"

export default async function fetchPrdv(training, hasAlsoJob, _axios = axios, _window = window, _logError = logError) {
  let res = null

  const prdvEndpoint = `https://rdv-cfa${env !== "production" ? "-recette" : ""}.apprentissage.beta.gouv.fr/api/appointment-request/context/create`

  if (!training) {
    return null
  }

  const response = await _axios.post(
    prdvEndpoint,
    {
      referrer: "lba",
      idCleMinistereEducatif: training.id,
      idRcoFormation: training.idRcoFormation,
      trainingHasJob: !!hasAlsoJob,
    },
    { headers: { "content-type": "application/json" } }
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
