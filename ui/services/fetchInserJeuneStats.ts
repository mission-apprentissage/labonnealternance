import axios, { AxiosError } from "axios"

import { inserJeuneApiUrl } from "../config/config"
import { logError } from "../utils/tools"

export default async function fetchInserJeuneStats(training) {
  if (!training) {
    return null
  }
  try {
    const response = await axios.get(`${inserJeuneApiUrl}/api/inserjeunes/regionales/${training.place.zipCode}/certifications/${training.cfd}`)
    return response.data
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response?.data?.message === "Pas de données disponibles") {
        return null
      }
    }
    logError("InserJeune API error", `InserJeune API error ${error}`)
  }
  return null
}
