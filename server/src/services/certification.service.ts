import axios from "axios"

import { sentryCaptureException } from "../common/utils/sentryUtils"
import config from "../config"

import { CertificationAPIApprentissage } from "./queryValidator.service.types"

const getFirstCertificationFromAPIApprentissage = async (rncp: string): Promise<CertificationAPIApprentissage | null> => {
  try {
    const { data } = await axios.get<CertificationAPIApprentissage[]>(`${config.apiApprentissage.baseUrl}/certification/v1?identifiant.rncp=${rncp}`, {
      headers: { Authorization: `Bearer ${config.apiApprentissage.apiKey}` },
    })

    if (!data.length) return null

    return data[0]
  } catch (error: any) {
    sentryCaptureException(error, { responseData: error.response?.data })
    return null
  }
}

const getRomesFromCertification = (certification: CertificationAPIApprentissage) => {
  return certification.domaines.rome.rncp.map((x) => x.code).join(",")
}
export const getRomesFromRncp = async (rncp: string): Promise<string | null> => {
  let certification = await getFirstCertificationFromAPIApprentissage(rncp)
  if (!certification) {
    return null
  }
  if (certification.periode_validite.rncp.actif) {
    return getRomesFromCertification(certification)
  } else {
    const latestRNCP = certification.continuite.rncp.findLast((rncp) => rncp.actif === true)
    if (!latestRNCP) {
      return getRomesFromCertification(certification)
    }
    certification = await getFirstCertificationFromAPIApprentissage(latestRNCP.code)
    if (!certification) {
      return null
    }
    return getRomesFromCertification(certification)
  }
}
