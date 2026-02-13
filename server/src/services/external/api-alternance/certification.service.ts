import { internal } from "@hapi/boom"
import axios from "axios"

import { sentryCaptureException } from "@/common/utils/sentryUtils"
import config from "@/config"
import type { CertificationAPIApprentissage } from "@/services/queryValidator.service.types"
import { expandRomesV3toV4 } from "@/services/rome.service"

const getFirstCertificationFromAPIApprentissage = async (rncp: string, throwOnError: boolean): Promise<CertificationAPIApprentissage | null> => {
  try {
    const { data } = await axios.get<CertificationAPIApprentissage[]>(`${config.apiApprentissage.baseUrl}/certification/v1?identifiant.rncp=${rncp}`, {
      headers: { Authorization: `Bearer ${config.apiApprentissage.apiKey}` },
    })

    if (!data.length) return null

    return data[0]
  } catch (error: any) {
    sentryCaptureException(error, { responseData: error.response?.data })

    if (throwOnError) {
      const err = internal("Erreur lors de la récupération des informations de certification", {
        responseData: error.response?.data,
        rncp: rncp,
      })
      err.cause = error
      throw err
    }

    return null
  }
}

async function resolveCertificationContinuity(rncp: string, throwOnError: boolean): Promise<CertificationAPIApprentissage | null> {
  const certification = await getFirstCertificationFromAPIApprentissage(rncp, throwOnError)

  if (certification === null) {
    return null
  }

  if (certification.periode_validite.rncp?.actif) {
    return certification
  }

  const activeRNCP = certification.continuite.rncp?.findLast((rncp) => rncp.actif === true)

  if (!activeRNCP) {
    return null
  }

  return resolveCertificationContinuity(activeRNCP.code, throwOnError)
}

export const getRomesFromRncp = async (rncp: string, throwOnError: boolean = false): Promise<string[] | null> => {
  const activeCertification = await resolveCertificationContinuity(rncp, throwOnError)

  if (!activeCertification) {
    return null
  }

  const romesV3 = activeCertification.domaines.rome.rncp.map((x) => x.code)
  const allRomes = await expandRomesV3toV4(romesV3)
  return allRomes
}
