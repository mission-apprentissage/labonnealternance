import { createReadStream } from "fs"
import querystring from "querystring"

import FormData from "form-data"

import config from "@/config"
import { FTResponse } from "@/services/ftjob.service.types"
import { IAppelattionDetailsFromAPI, IFTAPIToken, IRomeDetailsFromAPI, IRomeV4DetailsFromAPI, IRomeV4Short } from "@/services/rome.service.types"

import dayjs from "../../services/dayjs.service"
import { sentryCaptureException } from "../utils/sentryUtils"

import getApiClient from "./client"

const axiosClient = getApiClient({})

const ROME_ACCESS = querystring.stringify({
  grant_type: "client_credentials",
  client_id: config.esdClientId,
  client_secret: config.esdClientSecret,
  scope: `application_${config.esdClientId} api_romev1 nomenclatureRome`,
})

const ROME_V4_ACCESS = querystring.stringify({
  grant_type: "client_credentials",
  client_id: config.esdClientId,
  client_secret: config.esdClientSecret,
  scope: `application_${config.esdClientId} api_rome-metiersv1 nomenclatureRome`,
})

const OFFRES_ACCESS = querystring.stringify({
  grant_type: "client_credentials",
  client_id: config.esdClientId,
  client_secret: config.esdClientSecret,
  scope: `application_${config.esdClientId} api_offresdemploiv2 o2dsoffre`,
})

let tokenOffreFT: IFTAPIToken = {
  access_token: "",
  scope: "",
  token_type: "",
  expires_in: 0,
}
let tokenRomeFT: IFTAPIToken = {
  access_token: "",
  scope: "",
  token_type: "",
  expires_in: 0,
}
let tokenRomeV4FT: IFTAPIToken = {
  access_token: "",
  scope: "",
  token_type: "",
  expires_in: 0,
}

const isTokenValid = (token: IFTAPIToken): any => token?.expire?.isAfter(dayjs())

const getFtAccessToken = async (access: "OFFRE" | "ROME" | "ROMEV4", token): Promise<IFTAPIToken> => {
  const isValid = isTokenValid(token)

  if (isValid) {
    return token
  }

  try {
    const tokenParams = access === "OFFRE" ? OFFRES_ACCESS : access === "ROME" ? ROME_ACCESS : ROME_V4_ACCESS
    const response = await axiosClient.post(`${config.franceTravailIO.authUrl}?realm=%2Fpartenaire`, tokenParams, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 3000,
    })

    return {
      ...response.data,
      expire: dayjs().add(response.data.expires_in - 10, "s"),
    }
  } catch (error: any) {
    sentryCaptureException(error, { extra: { responseData: error.response?.data } })
    return error.response?.data
  }
}

/**
 * @description Search for FT Jobs
 */
export const searchForFtJobs = async (params: {
  codeROME: string
  commune: string
  sort: number
  natureContrat: string
  range: string
  niveauFormation?: string
  insee?: string
  distance?: number
}): Promise<FTResponse | null | ""> => {
  tokenOffreFT = await getFtAccessToken("OFFRE", tokenOffreFT)

  try {
    const extendedParams = {
      ...params,
      // paramètres exclurant les offres LBA des résultats de l'api PE
      partenaires: "LABONNEALTERNANCE",
      modeSelectionPartenaires: "EXCLU",
    }
    const { data } = await axiosClient.get(`${config.franceTravailIO.baseUrl}/offresdemploi/v2/offres/search`, {
      params: extendedParams,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${tokenOffreFT.access_token}`,
      },
    })

    return data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    sentryCaptureException(error, { extra: { responseData: error.response?.data } })
    return null
  }
}

/**
 * @description Get a FT Job
 */
export const getFtJob = async (id: string) => {
  tokenOffreFT = await getFtAccessToken("OFFRE", tokenOffreFT)
  try {
    const result = await axiosClient.get(`${config.franceTravailIO.baseUrl}/offresdemploi/v2/offres/${id}`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${tokenOffreFT.access_token}`,
      },
    })

    return result
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    sentryCaptureException(error, { extra: { responseData: error.response?.data } })
  }
}

/**
 * Utilitaire à garder pour interroger les référentiels FT non documentés par ailleurs
 * Liste des référentiels disponible sur https://www.emploi-store-dev.fr/portail-developpeur-cms/home/catalogue-des-api/documentation-des-api/api/api-offres-demploi-v2/referentiels.html
 *
 * @param {string} referentiel
 */
export const getFtReferentiels = async (referentiel: string) => {
  try {
    tokenOffreFT = await getFtAccessToken("OFFRE", tokenOffreFT)

    const data = await axiosClient.get(`${config.franceTravailIO.baseUrl}/offresdemploi/v2/referentiel/${referentiel}`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${tokenOffreFT.access_token}`,
      },
    })

    return data
  } catch (error: any) {
    sentryCaptureException(error, { extra: { responseData: error.response?.data } })
  }
}

/**
 * @deprecated use getRomeDetailsFromDB instead
 * @param romeCode
 * @returns
 */
export const getRomeDetailsFromAPI = async (romeCode: string): Promise<IRomeDetailsFromAPI | null | undefined> => {
  tokenRomeFT = await getFtAccessToken("ROME", tokenRomeFT)

  try {
    const { data } = await axiosClient.get<IRomeDetailsFromAPI>(`${config.franceTravailIO.baseUrl}/rome/v1/metier/${romeCode}`, {
      headers: {
        Authorization: `Bearer ${tokenRomeFT.access_token}`,
      },
    })

    return data
  } catch (error: any) {
    sentryCaptureException(error, { extra: { responseData: error.response?.data } })
    return null
  }
}

export const getAppellationDetailsFromAPI = async (appellationCode: string): Promise<IAppelattionDetailsFromAPI | null | undefined> => {
  tokenRomeFT = await getFtAccessToken("ROME", tokenRomeFT)

  try {
    const { data } = await axiosClient.get<IAppelattionDetailsFromAPI>(`${config.franceTravailIO.baseUrl}/rome/v1/appellation/${appellationCode}`, {
      headers: {
        Authorization: `Bearer ${tokenRomeFT.access_token}`,
      },
    })

    return data
  } catch (error: any) {
    sentryCaptureException(error, { extra: { responseData: error.response?.data } })
    if (error.response.status === 404) {
      return null
    }
  }
}

export const getRomeV4DetailsFromFT = async (romeCode: string): Promise<IRomeV4DetailsFromAPI | null | undefined> => {
  tokenRomeV4FT = await getFtAccessToken("ROMEV4", tokenRomeV4FT)

  try {
    const { data } = await axiosClient.get<IRomeV4DetailsFromAPI>(`${config.franceTravailIO.baseUrl}/v1/metiers/metier/${romeCode}`, {
      headers: {
        Authorization: `Bearer ${tokenRomeV4FT.access_token}`,
      },
    })

    return data
  } catch (error: any) {
    sentryCaptureException(error, { extra: { responseData: error.response?.data } })
    return null
  }
}

export const getRomeV4ListFromFT = async (): Promise<IRomeV4Short[] | null | undefined> => {
  tokenRomeV4FT = await getFtAccessToken("ROMEV4", tokenRomeV4FT)
  try {
    const { data } = await axiosClient.get<IRomeV4Short[]>(`${config.franceTravailIO.baseUrl}/v1/metiers/metier`, {
      headers: {
        Authorization: `Bearer ${tokenRomeV4FT.access_token}`,
      },
    })

    return data
  } catch (error: any) {
    sentryCaptureException(error, { extra: { responseData: error.response?.data } })
    return null
  }
}

/**
 * Sends CSV file to France Travail API through a "form data".
 */
export const sendCsvToFranceTravail = async (csvPath: string): Promise<void> => {
  const form = new FormData()
  form.append("login", config.franceTravailDepotOffres.login)
  form.append("password", config.franceTravailDepotOffres.password)
  form.append("nomFlux", config.franceTravailDepotOffres.nomFlux)
  form.append("fichierAenvoyer", createReadStream(csvPath))
  form.append("periodeRef", "")

  try {
    const { data } = await axiosClient.post(config.franceTravailIO.depotUrl, form, {
      headers: {
        ...form.getHeaders(),
      },
    })

    return data
  } catch (error: any) {
    sentryCaptureException(error, { extra: { responseData: error.response?.data } })
  }
}
