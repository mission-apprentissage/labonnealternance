import { ILbaItemFormation2 } from "shared"

import { inserJeuneApiUrl } from "../config/config"
import { logError } from "../utils/tools"

export default async function fetchInserJeuneStats(training: ILbaItemFormation2) {
  if (!training) {
    return null
  }
  try {
    const response = await fetch(`${inserJeuneApiUrl}/api/inserjeunes/regionales/${training.place.zipCode}/certifications/${training.training.cfd}`)

    return response.json()
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Pas de données disponibles") {
        return null
      }
    }
    logError("InserJeune API error", `InserJeune API error ${error}`)
  }
  return null
}
