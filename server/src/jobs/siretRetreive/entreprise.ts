import getApiClient from "@/common/apis/client"
import { ApiError, apiRateLimiter } from "@/common/utils/apiUtils"

import config from "../../config"

const apiParams = {
  token: config.entreprise.apiKey,
  context: config.entreprise.context,
  recipient: config.entreprise.recipient, // Siret Dinum
  object: config.entreprise.object,
}

// Cf Documentation : https://doc.entreprise.api.gouv.fr/#param-tres-obligatoires
const executeWithRateLimiting = apiRateLimiter("apiEntreprise", {
  //2 requests per second
  nbRequests: 1,
  durationInSeconds: 2,
  client: getApiClient({
    baseURL: "https://entreprise.api.gouv.fr/v3",
    timeout: 5000,
    headers: {
      Authorization: `Bearer ${config.entreprise.apiKey}`,
    },
  }),
})

export const getEtablissementAdreese = async (siret: string) => {
  return executeWithRateLimiting(async (client) => {
    try {
      const response = await client.get(`insee/sirene/etablissements/${siret}/adresse`, {
        params: apiParams,
      })
      if (!response?.data?.data) {
        throw new ApiError("Api Entreprise", "No etablissement data received")
      }
      return response.data.data
    } catch (e) {
      if (e.response.status === 404 || e.response.status === 451 || e.status === 422) return null
      console.log({ e })
      throw new ApiError("Api Entreprise getEtablissement", e.message, e.response.status)
    }
  })
}
