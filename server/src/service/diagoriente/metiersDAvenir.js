import Sentry from "@sentry/node"
import axios from "axios"
import dayjs from "dayjs"
import config from "../../config.js"

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

  const response = await axios.post(accessTokenEndpoint, paramApi, { "Content-Type": "application/x-www-form-urlencoded" })

  if (response.data) {
    diagorienteToken = {
      value: response.data.access_token,
      expiry: dayjs().add(response.data.expires_in - 10, "s"),
    }
    return diagorienteToken.value
  } else throw new Error("diagoriente_token_error")
}

export const getMetiersDAvenir = async () => {
  try {
    const token = await getAccessToken()
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }

    const job = await axios.post(
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
    return job.data.data
  } catch (error) {
    Sentry.captureException(error)
    return {
      error: "Error fetching suggestionsMetiersAvenir",
    }
  }
}
