import querystring from "querystring"

import axios from "axios"

import { sentryCaptureException } from "../common/utils/sentryUtils"
import config from "../config"

import dayjs from "./dayjs.service"
import { IAppelattionDetailsFromAPI, IPEAPIToken, IRomeDetailsFromAPI } from "./rome.service.types"

let token: IPEAPIToken = {
  access_token: "",
  scope: "",
  token_type: "",
  expires_in: 0,
}

const isTokenValid = (token: IPEAPIToken): boolean => token?.expire?.isAfter(dayjs())

const getToken = async (token): Promise<IPEAPIToken> => {
  const isValid = isTokenValid(token)

  if (isValid) {
    return token
  }

  try {
    const response = await axios.post(
      "https://entreprise.pole-emploi.fr/connexion/oauth2/access_token?realm=partenaire",
      querystring.stringify({
        grant_type: "client_credentials",
        client_id: config.poleEmploi.clientId,
        client_secret: config.poleEmploi.clientSecret,
        scope: `api_romev1 application_${config.poleEmploi.clientId} nomenclatureRome`,
      }),
      {
        headers: {
          Authorization: `Bearer ${config.poleEmploi.clientSecret}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    )

    return {
      ...response.data,
      expire: dayjs().add(response.data.expires_in - 10, "s"),
    }
  } catch (error) {
    console.log(error)
    return error.response.data
  }
}

export const getRomeDetailsFromAPI = async (romeCode: string): Promise<IRomeDetailsFromAPI> => {
  token = await getToken(token)

  try {
    const { data } = await axios.get<IRomeDetailsFromAPI>(`https://api.pole-emploi.io/partenaire/rome/v1/metier/${romeCode}`, {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
    })

    return data
  } catch (error) {
    sentryCaptureException(error)
    if (error.response.status === 404) {
      return null
    }
  }
}

export const getAppellationDetailsFromAPI = async (appellationCode: string): Promise<IAppelattionDetailsFromAPI> => {
  token = await getToken(token)

  try {
    const { data } = await axios.get<IAppelattionDetailsFromAPI>(`https://api.pole-emploi.io/partenaire/rome/v1/appellation/${appellationCode}`, {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
    })

    return data
  } catch (error) {
    sentryCaptureException(error)
    if (error.response.status === 404) {
      return null
    }
  }
}
