import type { ILbaItemFormation2Json } from "shared"

import { baseUrl } from "@/config/config"
import { logError } from "@/utils/tools"

export default async function fetchInserJeuneStats(training: ILbaItemFormation2Json) {
  if (!training) {
    return null
  }
  try {
    const response = await fetch(`${baseUrl}/api/inserjeune/${training.place.zipCode}/${training.training.cfd}`)

    if (response.status === 404) {
      return null
    }

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
