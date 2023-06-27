import config from "../config.js"
import { ApiError, apiRateLimiter } from "../common/utils/apiUtils.js"
import { sentryCaptureException } from "../common/utils/sentryUtils.js"
import getApiClient from "../common/client.js"

interface IBALResponse {
  is_valid: boolean
  on?: ("email" | "domain")[]
}

/**
 * Documentation https://bal.apprentissage.beta.gouv.fr/api/documentation/static/index.html
 */
const executeWithRateLimiting = apiRateLimiter("apiBal", {
  nbRequests: 2, // 2req/s
  durationInSeconds: 1,
  client: getApiClient({
    baseURL: config.bal.baseUrl,
    timeout: 5000,
  }),
})

/**
 * @description Validation d'appartenance à une organisation
 * @param {string} siret
 * @param {string} email
 * @returns
 */
export const validationOrganisation = async (siret: string, email: string): Promise<IBALResponse> => {
  return executeWithRateLimiting(async (client) => {
    try {
      const { data } = await client.post(
        `/organisation/validation`,
        {
          email,
          siret,
        },
        {
          headers: {
            Authorization: `Bearer ${config.bal.apiKey}`,
          },
        }
      )

      return data // is_valid: boolean, on: string "domain"|"email"
    } catch (error: any) {
      sentryCaptureException(error)
      return { is_valid: false }
      throw new ApiError("Api BAL", `${error.message} for siret=${siret}`, error.code || error.response?.status)
    }
  })
}
