import crypto from "crypto"
import { createReadStream } from "fs"
import querystring from "querystring"

import FormData from "form-data"

import config from "@/config"
import { PEResponse } from "@/services/pejob.service.types"
import { IAppelattionDetailsFromAPI, IPEAPIToken, IRomeDetailsFromAPI } from "@/services/rome.service.types"

import dayjs from "../../services/dayjs.service"
import { ApiError } from "../utils/apiUtils"
import { IApiError } from "../utils/errorManager"
import { sentryCaptureException } from "../utils/sentryUtils"

import getApiClient from "./client"

const LBF_API_BASE_URL = `https://labonneformation.pole-emploi.fr/api/v1`
const PE_IO_API_ROME_V1_BASE_URL = "https://api.pole-emploi.io/partenaire/rome/v1"
const PE_IO_API_OFFRES_BASE_URL = "https://api.pole-emploi.io/partenaire/offresdemploi/v2"
const PE_AUTH_BASE_URL = "https://entreprise.pole-emploi.fr/connexion/oauth2"
const PE_PORTAIL_BASE_URL = "https://portail-partenaire.pole-emploi.fr/partenaire"

// @kevin ?
// const getApiClient = (options = {}) =>
//   setupCache(
//     axios.create({
//       httpAgent: new http.Agent({ keepAlive: true }),
//       httpsAgent: new https.Agent({ keepAlive: true }),
//       ...options,
//     }),
//     {
//       ttl: 2000 * 60 * 10, // 20 Minutes
//     }
//   )

const axiosClient = getApiClient({})

/**
 * Construit et retourne les paramètres de la requête vers LBF
 * @param {string} id L'id RCO de la formation dont on veut récupérer les données sur LBF
 * @returns {string}
 */
const getLbfQueryParams = (id: string): string => {
  // le timestamp doit être uriencodé avec le format ISO sans les millis
  let date = new Date().toISOString()
  date = encodeURIComponent(date.substring(0, date.lastIndexOf(".")))

  let queryParams = `user=LBA&uid=${id}&timestamp=${date}`

  const hmac = crypto.createHmac("md5", config.laBonneFormationPassword)
  const data = hmac.update(queryParams)
  const signature = data.digest("hex")

  // le param signature doit contenir un hash des autres params chiffré avec le mdp attribué à LBA
  queryParams += "&signature=" + signature

  return queryParams
}

/**
 * @description Get LBF formation description
 * @param {string} id
 */
export const getLBFFormationDescription = async (id: string) => {
  const { data } = await axiosClient.get(`${LBF_API_BASE_URL}/detail?${getLbfQueryParams(id)}`)
  return data
}

const ROME_ACESS = querystring.stringify({
  grant_type: "client_credentials",
  client_id: config.poleEmploi.clientId,
  client_secret: config.poleEmploi.clientSecret,
  scope: `application_${config.poleEmploi.clientId} api_romev1 nomenclatureRome`,
})

const clientIdOffres = config.esdClientId === "1234" ? process.env.ESD_CLIENT_ID : config.esdClientId
const OFFRES_ACESS = querystring.stringify({
  grant_type: "client_credentials",
  client_id: clientIdOffres,
  client_secret: config.esdClientSecret === "1234" ? process.env.ESD_CLIENT_SECRET : config.esdClientSecret,
  scope: `application_${clientIdOffres} api_offresdemploiv2 o2dsoffre`,
})

let tokenOffrePE: IPEAPIToken = {
  access_token: "",
  scope: "",
  token_type: "",
  expires_in: 0,
}
let tokenRomePE: IPEAPIToken = {
  access_token: "",
  scope: "",
  token_type: "",
  expires_in: 0,
}

const isTokenValid = (token: IPEAPIToken): any => token?.expire?.isAfter(dayjs())

const getPeAccessToken = async (access: "OFFRE" | "ROME", token): Promise<IPEAPIToken> => {
  const isValid = isTokenValid(token)

  if (isValid) {
    return token
  }

  try {
    const response = await axiosClient.post(`${PE_AUTH_BASE_URL}/access_token?realm=%2Fpartenaire`, access === "OFFRE" ? OFFRES_ACESS : ROME_ACESS, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      //Authorization: `Bearer ${config.poleEmploi.clientSecret}`, ?
      timeout: 3000,
    })

    return {
      ...response.data,
      expire: dayjs().add(response.data.expires_in - 10, "s"),
    }
  } catch (error: any) {
    sentryCaptureException(error)
    return error.response.data
  }
}

/**
 * @description Search for PE Jobs
 */
export const searchForPeJobs = async (params: {
  codeROME: string
  commune: string
  sort: number
  natureContrat: string
  range: string
  niveauFormation?: string
  insee?: string
  distance?: number
}): Promise<IApiError | PEResponse | ""> => {
  tokenOffrePE = await getPeAccessToken("OFFRE", tokenOffrePE)
  try {
    const { data } = await axiosClient.get(`${PE_IO_API_OFFRES_BASE_URL}/offres/search`, {
      params,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${tokenOffrePE.access_token}`,
      },
    })

    return data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new ApiError("Api PE", error.message, error.code || error.response?.status)
  }
}

/**
 * @description Get a PE Job
 */
export const getPeJob = async (id: string) => {
  tokenOffrePE = await getPeAccessToken("OFFRE", tokenOffrePE)
  try {
    const { data } = await axiosClient.get(`${PE_IO_API_OFFRES_BASE_URL}/offres/${id}`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${tokenOffrePE.access_token}`,
      },
    })

    return data // PEResponse
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new ApiError("Api PE", error.message, error.code || error.response?.status)
  }
}

/**
 * Utilitaire à garder pour interroger les référentiels PE non documentés par ailleurs
 * Liste des référentiels disponible sur https://www.emploi-store-dev.fr/portail-developpeur-cms/home/catalogue-des-api/documentation-des-api/api/api-offres-demploi-v2/referentiels.html
 *
 * @param {string} referentiel
 */
export const getPeReferentiels = async (referentiel: string) => {
  try {
    tokenOffrePE = await getPeAccessToken("OFFRE", tokenOffrePE)

    const referentiels = await axiosClient.get(`${PE_IO_API_OFFRES_BASE_URL}/referentiel/${referentiel}`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${tokenOffrePE.access_token}`,
      },
    })

    console.log(`Référentiel ${referentiel} :`, referentiels) // retour car utilisation en mode CLI uniquement
  } catch (error) {
    console.log("error getReferentiel ", error)
  }
}

export const getRomeDetailsFromAPI = async (romeCode: string): Promise<IRomeDetailsFromAPI | null | undefined> => {
  tokenRomePE = await getPeAccessToken("ROME", tokenRomePE)

  try {
    const { data } = await axiosClient.get<IRomeDetailsFromAPI>(`${PE_IO_API_ROME_V1_BASE_URL}/metier/${romeCode}`, {
      headers: {
        Authorization: `Bearer ${tokenRomePE.access_token}`,
      },
    })

    return data
  } catch (error: any) {
    sentryCaptureException(error)
    return null
  }
}

export const getAppellationDetailsFromAPI = async (appellationCode: string): Promise<IAppelattionDetailsFromAPI | null | undefined> => {
  tokenRomePE = await getPeAccessToken("ROME", tokenRomePE)

  try {
    const { data } = await axiosClient.get<IAppelattionDetailsFromAPI>(`${PE_IO_API_ROME_V1_BASE_URL}/appellation/${appellationCode}`, {
      headers: {
        Authorization: `Bearer ${tokenRomePE.access_token}`,
      },
    })

    return data
  } catch (error: any) {
    sentryCaptureException(error)
    if (error.response.status === 404) {
      return null
    }
  }
}

/**
 * Sends CSV file to Pole Emploi API through a "form data".
 */
export const sendCsvToPE = async (csvPath: string): Promise<void> => {
  const form = new FormData()
  form.append("login", config.poleEmploiDepotOffres.login)
  form.append("password", config.poleEmploiDepotOffres.password)
  form.append("nomFlux", config.poleEmploiDepotOffres.nomFlux)
  form.append("fichierAenvoyer", createReadStream(csvPath))
  form.append("periodeRef", "")

  try {
    const { data } = await axiosClient.post(`${PE_PORTAIL_BASE_URL}/depotcurl`, form, {
      headers: {
        ...form.getHeaders(),
      },
    })

    return data
  } catch (error) {
    sentryCaptureException(error)
  }
}
