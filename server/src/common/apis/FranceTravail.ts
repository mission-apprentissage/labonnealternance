import { createReadStream } from "fs"
import querystring from "querystring"

import Boom from "boom"
import { ObjectId } from "bson"
import FormData from "form-data"
import { IFranceTravailAccess, IFranceTravailAccessType } from "shared/models/franceTravailAccess.model"

import config from "@/config"
import { FTResponse } from "@/services/ftjob.service.types"
import { IAppelattionDetailsFromAPI, IRomeDetailsFromAPI, ZFTApiToken } from "@/services/rome.service.types"

import { logger } from "../logger"
import { getDbCollection } from "../utils/mongodbUtils"
import { sentryCaptureException } from "../utils/sentryUtils"

import getApiClient from "./client"

const axiosClient = getApiClient({})

const getFTTokenFromDB = async (access_type: IFranceTravailAccessType): Promise<IFranceTravailAccess["access_token"] | undefined> => {
  const data = await getDbCollection("francetravaill_access").findOne({ access_type }, { projection: { access_token: 1, _id: 0 } })
  return data?.access_token
}
const updateFTTokenInDB = async ({ access_type, access_token }: { access_type: IFranceTravailAccessType; access_token: string }) =>
  await getDbCollection("francetravaill_access").findOneAndUpdate(
    { access_type },
    { $set: { access_token }, $setOnInsert: { _id: new ObjectId(), created_at: new Date() } },
    { upsert: true }
  )

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

const getFtAccessToken = async (access: IFranceTravailAccessType): Promise<string> => {
  const token = await getFTTokenFromDB(access)
  if (token) {
    return token
  }

  try {
    logger.info(`requesting new FT token for access=${access}`)
    const tokenParams = access === "OFFRE" ? OFFRES_ACCESS : access === "ROME" ? ROME_ACCESS : ROME_V4_ACCESS
    const response = await axiosClient.post(`${config.franceTravailIO.authUrl}?realm=%2Fpartenaire`, tokenParams, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 7000,
    })

    const validation = ZFTApiToken.safeParse(response.data)
    if (!validation.success) {
      throw Boom.internal("inattendu: FT api token format non valide", { error: validation.error })
    }

    await updateFTTokenInDB({ access_type: access, access_token: validation.data.access_token })

    return validation.data.access_token
  } catch (error: any) {
    logger.error("error lors de la récupération d'un token pour l'API FT", JSON.stringify(error))
    throw Boom.internal("impossible d'obtenir un token pour l'API france travail")
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
  const token = await getFtAccessToken("OFFRE")

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
  const token = await getFtAccessToken("OFFRE")
  const result = await axiosClient.get(`${config.franceTravailIO.baseUrl}/offresdemploi/v2/offres/${id}`, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  return result
}

/**
 * Utilitaire à garder pour interroger les référentiels FT non documentés par ailleurs
 * Liste des référentiels disponible sur https://www.emploi-store-dev.fr/portail-developpeur-cms/home/catalogue-des-api/documentation-des-api/api/api-offres-demploi-v2/referentiels.html
 *
 * @param {string} referentiel
 */
export const getFtReferentiels = async (referentiel: string) => {
  try {
    const token = await getFtAccessToken("OFFRE")

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
  const token = await getFtAccessToken("ROME")

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
  const token = await getFtAccessToken("ROME")

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
