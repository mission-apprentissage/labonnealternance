import { EDiffusibleStatus } from "shared/constants/diffusibleStatus"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { ZAdresseV3 } from "shared/models"
import { IEtablissementGouvData } from "shared/models/cacheInfosSiret.model"

import { sentryCaptureException } from "@/common/utils/sentryUtils"
import config from "@/config"

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
export async function getEtablissementFromGouvSafe(siret: string): Promise<IEtablissementGouvData | BusinessErrorCodes.NON_DIFFUSIBLE | null> {
  try {
    if (config.entreprise.simulateError) {
      throw new Error("API entreprise : simulation d'erreur")
    }
    const { data } = await client.get<IEtablissementGouvData>(`${config.entreprise.baseUrl}/sirene/etablissements/diffusibles/${encodeURIComponent(siret)}`, {
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
