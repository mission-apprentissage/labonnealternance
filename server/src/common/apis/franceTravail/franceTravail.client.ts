import { createReadStream } from "fs"
import querystring from "querystring"

import { internal } from "@hapi/boom"
import { ObjectId } from "bson"
import FormData from "form-data"
import { sleep } from "openai/core.mjs"
import { IFTJobRaw } from "shared"
import { IRomeoAPIResponse } from "shared/models/cacheRomeo.model"
import { IFranceTravailAccess, IFranceTravailAccessType } from "shared/models/franceTravailAccess.model"

import config from "@/config"
import { FTResponse } from "@/services/ftjob.service.types"
import { ZFTApiToken } from "@/services/rome.service.types"

import { logger } from "../../logger"
import { apiRateLimiter } from "../../utils/apiUtils"
import { getDbCollection } from "../../utils/mongodbUtils"
import { sentryCaptureException } from "../../utils/sentryUtils"
import { notifyToSlack } from "../../utils/slackUtils"
import getApiClient from "../client"

const axiosClient = getApiClient({}, { cache: false })

const RomeoLimiter = apiRateLimiter("apiRomeo", {
  nbRequests: 1,
  durationInSeconds: 1,
  client: axiosClient,
})

const OffreFranceTravailLimiter = apiRateLimiter("apiOffreFT", {
  nbRequests: 10,
  durationInSeconds: 1,
  client: axiosClient,
})

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
      throw internal("inattendu: FT api token format non valide", { error: validation.error })
    }

    await updateFranceTravailTokenInDB({ access_type: access, access_token: validation.data.access_token })

    return validation.data.access_token
  } catch (error: any) {
    sentryCaptureException(error, { extra: { responseData: error.response?.data } })
    throw internal("impossible d'obtenir un token pour l'API france travail")
  }
}

/**
 * @description Search for FT Jobs
 */
export const searchForFtJobs = async (
  params: {
    codeROME?: string
    commune?: string
    departement?: string
    region?: string
    sort?: number
    natureContrat: string
    range: string
    niveauFormation?: string
    insee?: string
    distance?: number
    publieeDepuis?: number
  },
  options: {
    throwOnError: boolean
  }
): Promise<{ data: FTResponse; contentRange: string } | null | ""> => {
  const token = await getToken("OFFRE")
  return OffreFranceTravailLimiter(async (client) => {
    try {
      const extendedParams = {
        ...params,
        // paramètres exclurant les offres LBA des résultats de l'api PE
        partenaires: "LABONNEALTERNANCE",
        modeSelectionPartenaires: "EXCLU",
      }

      const { data, headers } = await client.get(`${config.franceTravailIO.baseUrl}/offresdemploi/v2/offres/search`, {
        params: extendedParams,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      return { data, contentRange: headers["content-range"] } //  fyi: 'content-range': 'offres 0-149/9981',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (options.throwOnError) {
        throw error
      }
      sentryCaptureException(error, { extra: { responseData: error.response?.data } })
      return null
    }
  })
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
      timeout: 0,
    })

    if (data !== "Votre fichier a bien ete envoye\n") {
      throw new Error(data)
    }
  } catch (error: any) {
    logger.error(error)
    sentryCaptureException(error, { extra: { responseData: error.response?.data } })
    throw error
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
export const getRomeoPredictions = async (payload: IRomeoPayload[], options: IRomeoOptions = { nomAppelant: "La bonne alternance" }): Promise<IRomeoAPIResponse | null> => {
  if (payload.length > 50) throw Error("Maximum recommanded array size is 50") // Louis feeback https://mna-matcha.atlassian.net/browse/LBA-2232?focusedCommentId=13000
  const token = await getToken("ROMEO")
  return RomeoLimiter(async (client) => {
    try {
      const result = await client.post(
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
      logger.error("error", error)
      sentryCaptureException(error, { extra: { responseData: error.response?.data } })
      return null
    }
  })
}
// Documentation https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/operations/recupererListeOffre
export const getAllFTJobsByDepartments = async (departement: string) => {
  const jobLimit = 150
  let start = 0
  let total = 1

  let allJobs = [] as Omit<IFTJobRaw, "_id" | "createdAt">[]

  while (start < total) {
    // Construct the range for this "page"
    const range = `${start}-${start + jobLimit - 1}`

    // Prepare your query params
    const params: Parameters<typeof searchForFtJobs>[0] = {
      natureContrat: "E2,FS", // E2 -> Contrat d'Apprentissage, FS -> contrat de professionalisation
      range,
      departement,
      // publieeDepuis: 7, // Il vaut mieux ne pas mettre de date de publication pour avoir le plus de résultats possible
      sort: 1, // making sure we get the most recent jobs first
    }

    try {
      const response = await searchForFtJobs(params, { throwOnError: true })
      await sleep(1500)
      if (!response) {
        throw new Error("No response from FranceTravail")
      }

      const { data: jobs, contentRange } = response

      if (!jobs.resultats) {
        //  logger.info("No resultats from FranceTravail", params)
        break
      }

      allJobs = [...allJobs, ...(jobs.resultats as Omit<IFTJobRaw, "_id" | "createdAt">[])]

      // Safely parse out the total
      // Usually, contentRange might look like "offres 0-149/9981"
      // We split by "/" and take the second part (9981), converting to Number
      if (contentRange) {
        const totalString = contentRange.split("/")[1]
        if (totalString) {
          total = parseInt(totalString, 10)
        }
      }

      // Move to the next "page"
      start += jobLimit
    } catch (error: any) {
      // handle 3000 limit page reach
      if (error.response?.data?.message === "La position de début doit être inférieure ou égale à 3000.") {
        sentryCaptureException(error)
        await notifyToSlack({
          subject: "Import Offres France Travail",
          message: `Limite des 3000 offres par département dépassée! dept: ${departement} total: ${total}`,
          error: true,
        })
        throw error
      }
      if (error.response?.data?.message === "Valeur du paramètre « region » incorrecte." || error.response?.data?.message === "Valeur du paramètre « departement » incorrecte.") {
        // code region or departement not found
        break
      }
      logger.error("Error while fetching jobs", error)
    }
  }
  return allJobs
}
