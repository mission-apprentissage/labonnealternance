import axios from "axios"

import { sentryCaptureException } from "../common/utils/sentryUtils"
import config from "../config"

import dayjs from "./dayjs.service"
import { ISuggestionMetiersDavenir } from "./diagoriente.service.types"

let diagorienteToken = null

const clientId = config.diagoriente.clientId
const clientSecret = config.diagoriente.clientSecret
const realm = config.diagoriente.realm

const paramApi = `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
const accessTokenEndpoint = `https://auth.diagoriente.beta.gouv.fr/auth/realms/${realm}/protocol/openid-connect/token`
const diagorienteUrl = config.diagoriente.queryUrl

const getAccessToken = async () => {
  const now = dayjs()

  if (diagorienteToken && diagorienteToken.expiry.isAfter(now)) return diagorienteToken.value

  const response = await axios.post(accessTokenEndpoint, paramApi, { headers: { "Content-Type": "application/x-www-form-urlencoded" } })

  if (response.data) {
    diagorienteToken = {
      value: response.data.access_token,
      expiry: dayjs().add(response.data.expires_in - 10, "s"),
    }
    return diagorienteToken.value
  } else throw new Error("diagoriente_token_error")
}

/**
 * @description Interroge l'api Diagoriente pour récupérer des suggestions de métiers d'avenir
 * @returns {Promise<ISuggestionMetiersDavenir>}
 */
export const getMetiersDAvenir = async (): Promise<ISuggestionMetiersDavenir> => {
  try {
    const token = await getAccessToken()
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }

    const { data } = await axios.post(
      diagorienteUrl,
      JSON.stringify({
        query: `{
          suggestionsMetiersAvenir(count: 8) {
            codeROME
            title
          }}`,
      }),
      {
        headers,
      }
    )
    return data.data
  } catch (error) {
    sentryCaptureException(error)
    return {
      error: "Error fetching suggestionsMetiersAvenir",
    }
  }
}
