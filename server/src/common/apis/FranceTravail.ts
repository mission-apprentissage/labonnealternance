import { createReadStream } from "fs"
import querystring from "querystring"

import Boom from "boom"
import FormData from "form-data"
import { TDayjs } from "shared/helpers/dayjs"
import { IFicheRome } from "shared/models"

import config from "@/config"
import { FTResponse } from "@/services/ftjob.service.types"
import { IAppelattionDetailsFromAPI, IRomeDetailsFromAPI, IRomeV4Short, ZFTApiToken } from "@/services/rome.service.types"

import dayjs from "../../services/dayjs.service"
import { logger } from "../logger"
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

const tokens: Record<"OFFRE" | "ROME" | "ROMEV4", FTMemoryToken | null> = {
  OFFRE: null,
  ROME: null,
  ROMEV4: null,
}

type FTMemoryToken = {
  token: string
  expire: TDayjs
}

const isTokenValid = (token: FTMemoryToken): boolean => token.expire.isAfter(dayjs())

const getFtAccessToken = async (access: "OFFRE" | "ROME" | "ROMEV4"): Promise<FTMemoryToken> => {
  const token = tokens[access]
  if (token && isTokenValid(token)) {
    return token
  }

  try {
    logger.info(`requesting new FT token for access=${access}`)
    const tokenParams = access === "OFFRE" ? OFFRES_ACCESS : access === "ROME" ? ROME_ACCESS : ROME_V4_ACCESS
    const response = await axiosClient.post(`${config.franceTravailIO.authUrl}?realm=%2Fpartenaire`, tokenParams, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 3000,
    })

    const validation = ZFTApiToken.safeParse(response.data)
    if (!validation.success) {
      throw Boom.internal("inattendu: FT api token format non valide", { error: validation.error })
    }

    const newTokenObject = {
      token: validation.data.access_token,
      expire: dayjs().add(response.data.expires_in - 10, "s"),
    }
    tokens[access] = newTokenObject
    return newTokenObject
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
  const { token } = await getFtAccessToken("OFFRE")

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
        Authorization: `Bearer ${token}`,
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
  const { token } = await getFtAccessToken("OFFRE")
  try {
    const result = await axiosClient.get(`${config.franceTravailIO.baseUrl}/offresdemploi/v2/offres/${id}`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
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
    const { token } = await getFtAccessToken("OFFRE")

    const data = await axiosClient.get(`${config.franceTravailIO.baseUrl}/offresdemploi/v2/referentiel/${referentiel}`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
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
  const { token } = await getFtAccessToken("ROME")

  try {
    const { data } = await axiosClient.get<IRomeDetailsFromAPI>(`${config.franceTravailIO.baseUrl}/rome/v1/metier/${romeCode}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return data
  } catch (error: any) {
    sentryCaptureException(error, { extra: { responseData: error.response?.data } })
    return null
  }
}

export const getAppellationDetailsFromAPI = async (appellationCode: string): Promise<IAppelattionDetailsFromAPI | null | undefined> => {
  const { token } = await getFtAccessToken("ROME")

  try {
    const { data } = await axiosClient.get<IAppelattionDetailsFromAPI>(`${config.franceTravailIO.baseUrl}/rome/v1/appellation/${appellationCode}`, {
      headers: {
        Authorization: `Bearer ${token}`,
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

export const getRomeV4DetailsFromFT = async (romeCode: string): Promise<IFicheRome | null | undefined> => {
  const { token } = await getFtAccessToken("ROMEV4")

  try {
    const { data } = await axiosClient.get<IFicheRome>(`${config.franceTravailIO.baseUrl}/rome-metiers/v1/metiers/metier/${romeCode}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return data
  } catch (error: any) {
    sentryCaptureException(error, { extra: { responseData: error.response?.data } })
    return null
  }
}

export const getRomeV4ListFromFT = async (): Promise<IRomeV4Short[] | null | undefined> => {
  const { token } = await getFtAccessToken("ROMEV4")
  try {
    const { data } = await axiosClient.get<IRomeV4Short[]>(`${config.franceTravailIO.baseUrl}/rome-metiers/v1/metiers/metier?champs=code`, {
      headers: {
        Authorization: `Bearer ${token}`,
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
