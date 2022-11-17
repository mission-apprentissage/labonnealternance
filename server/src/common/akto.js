import Sentry from "@sentry/node"
import axios from "axios"
import dayjs from "dayjs"
import querystring from "querystring"
import config from "../config.js"

const isTokenValid = (token) => dayjs().isAfter(dayjs(token.expire))

/**
 * @description get auth token from gateway
 * @param {*} token
 * @returns {object} token data
 */
const getToken = async (token = {}) => {
  const isValid = isTokenValid(token)

  if (isValid) {
    return token
  }

  try {
    const response = await axios.post(
      "https://login.microsoftonline.com/0285c9cb-dd17-4c1e-9621-c83e9204ad68/oauth2/v2.0/token",
      querystring.stringify({
        grant_type: config.akto.grant_type,
        client_id: config.akto.client_id,
        client_secret: config.akto.client_secret,
        scope: config.akto.scope,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    )

    return {
      ...response.data,
      expire: dayjs().add(response.data.expires_in - 10, "s"),
    }
  } catch (error) {
    Sentry.captureException(error)
    return error
  }
}

/**
 * @description Check Akto referential using siren & email submitted by user
 * @param {string} siren
 * @param {string} email
 * @param {string} token
 * @returns {boolean}
 */
export const getAktoEstablishmentVerification = async (siren, email, token) => {
  token = await getToken(token)

  try {
    const { data } = await axios.get(`https://api.akto.fr/referentiel/api/v1/Relations/Validation?email=${email}&siren=${siren}`, {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
    })

    return data.data.match
  } catch (error) {
    Sentry.captureException(error)
    return error
  }
}
