import type { ILbaItemFormation2Json } from "shared"

import { logError } from "@/utils/tools"
import { publicConfig } from "@/config.public"

const baseUrl = publicConfig.apiEndpoint

export default async function fetchInserJeunesStats(training: ILbaItemFormation2Json) {
  if (!training) {
    return null
  }
  try {
    const response = await fetch(`${baseUrl}/inserjeunes/${training.place.zipCode}/${training.training.cfd}`)
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
    logError("InserJeunes API error", `InserJeunes API error ${error}`)
  }
  return null
}
