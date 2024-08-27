import { createReadStream } from "fs"
import querystring from "querystring"

import Boom from "boom"
import { ObjectId } from "bson"
import FormData from "form-data"
import { IRomeoApiResponse } from "shared/models/cacheRomeo.model"
import { IFranceTravailAccess, IFranceTravailAccessType } from "shared/models/franceTravailAccess.model"

import config from "@/config"
import { FTResponse } from "@/services/ftjob.service.types"
import { ZFTApiToken } from "@/services/rome.service.types"

import { logger } from "../../logger"
import { getDbCollection } from "../../utils/mongodbUtils"
import { sentryCaptureException } from "../../utils/sentryUtils"
import getApiClient from "../client"

const axiosClient = getApiClient({}, { cache: false })

const getFranceTravailTokenFromDB = async (access_type: IAccessParams): Promise<IFranceTravailAccess["access_token"] | undefined> => {
  const data = await getDbCollection("francetravail_access").findOne({ access_type }, { projection: { access_token: 1, _id: 0 } })
  return data?.access_token
}
const updateFranceTravailTokenInDB = async ({ access_type, access_token }: { access_type: IFranceTravailAccessType; access_token: string }) =>
  await getDbCollection("francetravail_access").findOneAndUpdate(
    { access_type },
    { $set: { access_token }, $setOnInsert: { _id: new ObjectId(), created_at: new Date() } },
    { upsert: true }
  )

export const ACCESS_PARAMS = {
  OFFRE: querystring.stringify({
    grant_type: "client_credentials",
    client_id: config.esdClientId,
    client_secret: config.esdClientSecret,
    scope: `application_${config.esdClientId} api_offresdemploiv2 o2dsoffre`,
  }),
  ROMEO: querystring.stringify({
    grant_type: "client_credentials",
    client_id: config.esdClientId,
    client_secret: config.esdClientSecret,
    scope: `application_${config.esdClientId} api_romeov2`,
  }),
}

export type IAccessParams = keyof typeof ACCESS_PARAMS

const getToken = async (access: IAccessParams) => {
  const token = await getFranceTravailTokenFromDB(access)
  if (token) {
    return token
  } else {
    return await getFranceTravailTokenFromAPI(access)
  }
}

export const getFranceTravailTokenFromAPI = async (access: IAccessParams): Promise<string> => {
  try {
    logger.info(`requesting new FT token for access=${access}`)
    const tokenParams = ACCESS_PARAMS[access]
    const response = await axiosClient.post(`${config.franceTravailIO.authUrl}?realm=partenaire`, tokenParams, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 3000,
    })

    const validation = ZFTApiToken.safeParse(response.data)
    if (!validation.success) {
      throw Boom.internal("inattendu: FT api token format non valide", { error: validation.error })
    }

    await updateFranceTravailTokenInDB({ access_type: access, access_token: validation.data.access_token })

    return validation.data.access_token
  } catch (error: any) {
    sentryCaptureException(error, { extra: { responseData: error.response?.data } })
    throw Boom.internal("impossible d'obtenir un token pour l'API france travail")
  }
}

/**
 * @description Search for FT Jobs
 */
export const searchForFtJobs = async (params: {
  codeROME?: string
  commune?: string
  sort: number
  natureContrat: string
  range: string
  niveauFormation?: string
  insee?: string
  distance?: number
}): Promise<FTResponse | null | ""> => {
  const token = await getToken("OFFRE")

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
  const token = await getToken("OFFRE")
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

export type IRomeoPayload = {
  intitule: string
  identifiant: string
  contexte?: string
}
type IRomeoOptions = {
  nomAppelant: string
  nbResultats?: number // betwwen 1 and 25, default 5
  seuilScorePrediction?: number
}
export const getRomeoPredictions = async (payload: IRomeoPayload[], options: IRomeoOptions = { nomAppelant: "La bonne alternance" }): Promise<IRomeoApiResponse | null> => {
  if (payload.length > 50) throw Error("Maximum recommanded array size is 50") // Louis feeback https://mna-matcha.atlassian.net/browse/LBA-2232?focusedCommentId=13000
  const token = await getToken("ROMEO")
  try {
    const result = await axiosClient.post(
      `${config.franceTravailIO.baseUrl}/romeo/v2/predictionMetiers`,
      { appellations: payload, options },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    )
    return result.data
  } catch (error: any) {
    sentryCaptureException(error, { extra: { responseData: error.response?.data } })
    return null
  }
}
