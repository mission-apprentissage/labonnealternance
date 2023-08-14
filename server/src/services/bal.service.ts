import axios from "axios"
import http from "http"
import https from "https"
import { setupCache } from "axios-cache-interceptor"
import config from "../config.js"
import { ApiError, apiRateLimiter } from "../common/utils/apiUtils.js"
import { sentryCaptureException } from "../common/utils/sentryUtils.js"

const getApiClient = (options) =>
  setupCache(
    axios.create({
      timeout: 5000,
      httpAgent: new http.Agent({ keepAlive: true }),
      httpsAgent: new https.Agent({ keepAlive: true }),
      ...options,
    }),
    {
      ttl: 1000 * 60 * 10, // 10 Minutes
    }
  )

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
