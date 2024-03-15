import { createReadStream } from "fs"
import querystring from "querystring"

import FormData from "form-data"

import config from "@/config"
import { PEResponse } from "@/services/pejob.service.types"
import { IAppelattionDetailsFromAPI, IPEAPIToken, IRomeDetailsFromAPI } from "@/services/rome.service.types"

import dayjs from "../../services/dayjs.service"
import { sentryCaptureException } from "../utils/sentryUtils"

import getApiClient from "./client"

const PE_IO_API_ROME_V1_BASE_URL = "https://api.pole-emploi.io/partenaire/rome/v1"
const PE_IO_API_OFFRES_BASE_URL = "https://api.pole-emploi.io/partenaire/offresdemploi/v2"
const PE_AUTH_BASE_URL = "https://entreprise.pole-emploi.fr/connexion/oauth2"
const PE_PORTAIL_BASE_URL = "https://portail-partenaire.pole-emploi.fr/partenaire"

// paramètres exclurant les offres LBA des résultats de l'api PE
const PE_LBA_PARTENAIRE = "LABONNEALTERNANCE"
const PE_PARTENAIRE_MODE = "EXCLU"

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
      timeout: 3000,
    })

    return {
      ...response.data,
      expire: dayjs().add(response.data.expires_in - 10, "s"),
    }
  } catch (error: any) {
    sentryCaptureException(error.response?.data)
    return error.response?.data
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
}): Promise<PEResponse | null> => {
  tokenOffrePE = await getPeAccessToken("OFFRE", tokenOffrePE)
  try {
    const extendedParams = {
      ...params,
      partenaires: PE_LBA_PARTENAIRE,
      modeSelectionPartenaires: PE_PARTENAIRE_MODE,
    }
    const { data } = await axiosClient.get(`${PE_IO_API_OFFRES_BASE_URL}/offres/search`, {
      params: extendedParams,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${tokenOffrePE.access_token}`,
      },
    })

    return data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    sentryCaptureException(error.response?.data)
    return null
  }
}

/**
 * @description Get a PE Job
 */
export const getPeJob = async (id: string) => {
  tokenOffrePE = await getPeAccessToken("OFFRE", tokenOffrePE)
  try {
    const result = await axiosClient.get(`${PE_IO_API_OFFRES_BASE_URL}/offres/${id}`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${tokenOffrePE.access_token}`,
      },
    })

    return result // PEResponse
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    sentryCaptureException(error.response?.data)
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

/**
 * @deprecated use getRomeDetailsFromDB instead
 * @param romeCode
 * @returns
 */
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
    sentryCaptureException(error.response?.data)
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
