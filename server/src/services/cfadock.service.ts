import axios, { AxiosResponse } from "axios"

const cfaDockEndpoint = "https://www.cfadock.fr/api/opcos"

export const CFADOCK_FILTER_LIMIT = 100

/**
 * @description Interroge CFADock pour récupérer les opcos associés aux sirens passés en paramètre
 * @param {Set<string>} un ensemble de sirens
 * @returns {Promise<AxiosResponse<any, any>>}
 */
export const fetchOpcosFromCFADock = async (sirenSet: Set<string>): Promise<AxiosResponse<any, any>> => {
  return axios.post(
    cfaDockEndpoint,
    Array.from(sirenSet, (siret) => ({ siret })),
    { headers: { accept: "text/plain" } }
  )
}
