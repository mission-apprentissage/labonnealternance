import { EDiffusibleStatus } from "shared/constants/diffusible-status"
import { BusinessErrorCodes } from "shared/constants/error-codes"
import type { IEtablissementGouvData } from "shared/models/cache-infos-siret.model"
import { ZAdresseV3 } from "shared/models/index"

import getApiClient from "@/common/apis/client"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import config from "@/config"

const client = getApiClient({ timeout: 5000 })

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
    // Erreur dédiée plutôt que l'AxiosError brut : celui-ci porte `config.params.token` (la clé
    // d'API entreprise, transmise en query string), que extraErrorDataIntegration sérialiserait
    // tel quel dans Sentry.
    sentryCaptureException(new Error(`api-entreprise: échec de récupération de l'établissement (${error.message ?? "erreur inconnue"})`), {
      extra: { siret, status, responseData: error?.response?.data },
    })
    if ([502, 503, 504].includes(status)) {
      return null
    }
    throw error
  }
}
