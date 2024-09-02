import { ObjectId } from "mongodb"
import { EDiffusibleStatus } from "shared/constants/diffusibleStatus"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { ISiretDiffusibleStatus, ZAdresseV3 } from "shared/models"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import config from "@/config"
import { IAPIEtablissement } from "@/services/etablissement.service.types"

import getApiClient from "../client"

const client = getApiClient({ timeout: 5000 }, { cache: true })

const apiParams = {
  token: config.entreprise.apiKey,
  context: config.entreprise.context,
  recipient: config.entreprise.recipient, // Siret Dinum
  object: config.entreprise.object,
}

/**
 * @description Get the establishment information from the ENTREPRISE API for a given SIRET
 */
export async function getEtablissementFromGouvSafe(siret: string): Promise<IAPIEtablissement | BusinessErrorCodes.NON_DIFFUSIBLE | null> {
  try {
    if (config.entreprise.simulateError) {
      throw new Error("API entreprise : simulation d'erreur")
    }
    const { data } = await client.get<IAPIEtablissement>(`${config.entreprise.baseUrl}/sirene/etablissements/diffusibles/${encodeURIComponent(siret)}`, {
      params: apiParams,
    })
    if (data.data.status_diffusion !== EDiffusibleStatus.DIFFUSIBLE) {
      return BusinessErrorCodes.NON_DIFFUSIBLE
    }
    ZAdresseV3.parse(data.data.adresse)
    return data
  } catch (error: any) {
    const status = error?.response?.status
    if (status === 451) {
      return BusinessErrorCodes.NON_DIFFUSIBLE
    }
    if ([404, 422, 429].includes(status)) {
      return null
    }
    sentryCaptureException(error)
    throw error
  }
}

const saveSiretDiffusionStatus = async (siret, diffusionStatus) => {
  try {
    const now = new Date()
    const obj: ISiretDiffusibleStatus = {
      _id: new ObjectId(),
      siret,
      status_diffusion: diffusionStatus,
      created_at: now,
      last_update_at: now,
    }
    await getDbCollection("siretdiffusiblestatuses").insertOne(obj)
  } catch (err) {
    // non blocking error
    sentryCaptureException(err)
  }
}

/**
 * @description Get diffusion status from the ENTREPRISE API for a given SIRET
 */
export async function getEtablissementDiffusionStatus(siret: string): Promise<string> {
  try {
    if (config.entreprise.simulateError) {
      throw new Error("API entreprise : simulation d'erreur")
    }

    const siretDiffusibleStatus = await getDbCollection("siretdiffusiblestatuses").findOne({ siret })
    if (siretDiffusibleStatus) {
      return siretDiffusibleStatus.status_diffusion
    }

    const { data } = await client.get<IAPIEtablissement>(`${config.entreprise.baseUrl}/sirene/etablissements/diffusibles/${encodeURIComponent(siret)}/adresse`, {
      params: apiParams,
    })
    await saveSiretDiffusionStatus(siret, data.data.status_diffusion)

    return data.data.status_diffusion
  } catch (error: any) {
    if (error?.response?.status === 404) {
      await saveSiretDiffusionStatus(siret, EDiffusibleStatus.NOT_FOUND)
      return EDiffusibleStatus.NOT_FOUND
    }
    if (error?.response?.status === 451) {
      await saveSiretDiffusionStatus(siret, EDiffusibleStatus.UNAVAILABLE)
      return EDiffusibleStatus.UNAVAILABLE
    }
    if (error?.response?.status === 429 || error?.response?.status === 504) {
      return "quota"
    }
    if (error?.code === "ECONNABORTED") {
      return "quota"
    }
    sentryCaptureException(error)
    throw error
  }
}
