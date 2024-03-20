import { createReadStream } from "fs"
import querystring from "querystring"

import FormData from "form-data"

import config from "@/config"
import { FTResponse } from "@/services/ftjob.service.types"
import { IAppelattionDetailsFromAPI, IFTAPIToken, IRomeDetailsFromAPI } from "@/services/rome.service.types"

import dayjs from "../../services/dayjs.service"
import { sentryCaptureException } from "../utils/sentryUtils"

import getApiClient from "./client"

const FT_IO_API_ROME_V1_BASE_URL = "https://api.pole-emploi.io/partenaire/rome/v1"
const FT_IO_API_OFFRES_BASE_URL = "https://api.pole-emploi.io/partenaire/offresdemploi/v2"
const FT_AUTH_BASE_URL = "https://entreprise.pole-emploi.fr/connexion/oauth2"
const FT_PORTAIL_BASE_URL = "https://portail-partenaire.pole-emploi.fr/partenaire"

// paramètres exclurant les offres LBA des résultats de l'api PE
const FT_LBA_PARTENAIRE = "LABONNEALTERNANCE"
const FT_PARTENAIRE_MODE = "EXCLU"

const axiosClient = getApiClient({})

const ROME_ACESS = querystring.stringify({
  grant_type: "client_credentials",
  client_id: config.esdClientId,
  client_secret: config.esdClientSecret,
  scope: `application_${config.esdClientId} api_romev1 nomenclatureRome`,
})

const OFFRES_ACESS = querystring.stringify({
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

const isTokenValid = (token: IFTAPIToken): any => token?.expire?.isAfter(dayjs())

const getFtAccessToken = async (access: "OFFRE" | "ROME", token): Promise<IFTAPIToken> => {
  const isValid = isTokenValid(token)

  if (isValid) {
    return token
  }

  try {
    const response = await axiosClient.post(`${FT_AUTH_BASE_URL}/access_token?realm=%2Fpartenaire`, access === "OFFRE" ? OFFRES_ACESS : ROME_ACESS, {
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
      partenaires: FT_LBA_PARTENAIRE,
      modeSelectionPartenaires: FT_PARTENAIRE_MODE,
    }
    const { data } = await axiosClient.get(`${FT_IO_API_OFFRES_BASE_URL}/offres/search`, {
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
    const result = await axiosClient.get(`${FT_IO_API_OFFRES_BASE_URL}/offres/${id}`, {
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

    const data = await axiosClient.get(`${FT_IO_API_OFFRES_BASE_URL}/referentiel/${referentiel}`, {
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
    const { data } = await axiosClient.get<IRomeDetailsFromAPI>(`${FT_IO_API_ROME_V1_BASE_URL}/metier/${romeCode}`, {
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
    const { data } = await axiosClient.get<IAppelattionDetailsFromAPI>(`${FT_IO_API_ROME_V1_BASE_URL}/appellation/${appellationCode}`, {
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
    const { data } = await axiosClient.post(`${FT_PORTAIL_BASE_URL}/depotcurl`, form, {
      headers: {
        ...form.getHeaders(),
      },
    })

    return data
  } catch (error: any) {
    sentryCaptureException(error, { extra: { responseData: error.response?.data } })
  }
}
