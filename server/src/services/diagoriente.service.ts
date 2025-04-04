import { internal } from "@hapi/boom"
import axios from "axios"
import { IMetiersDavenir } from "shared/models/index"

import { getHttpClient } from "@/common/utils/httpUtils"

import config from "../config"

import dayjs from "./dayjs.service"

const paramApi = `grant_type=client_credentials&client_id=${config.diagoriente.clientId}&client_secret=${config.diagoriente.clientSecret}`
const accessTokenEndpoint = `https://auth.diagoriente.beta.gouv.fr/auth/realms/${config.diagoriente.realm}/protocol/openid-connect/token`

let diagorienteToken

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
 */
export const getMetiersDAvenir = async (): Promise<IMetiersDavenir> => {
  try {
    const token = await getAccessToken()
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }

    const { data } = await getHttpClient().post(
      config.diagoriente.queryUrl,
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
    const newError = internal("Error fetching suggestionsMetiersAvenir")
    newError.cause = error
    throw newError
  }
}
