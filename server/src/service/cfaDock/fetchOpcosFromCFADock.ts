import axios from "axios"

const cfaDockEndpoint = "https://www.cfadock.fr/api/opcos"

export const CFADOCK_FILTER_LIMIT = 100

const getSirenParams = (sirenSet) => {
  const sirenParams = []

  sirenSet.forEach((v) => {
    sirenParams.push({ siret: v })
  })

  return sirenParams
}

export const fetchOpcosFromCFADock = async (sirenSet) => {
  const sirenParams = getSirenParams(sirenSet)
  return await axios.post(cfaDockEndpoint, sirenParams, { headers: { accept: "text/plain" } })
}
