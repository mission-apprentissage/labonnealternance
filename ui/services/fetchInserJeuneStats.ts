import type { ILbaItemFormation2Json } from "shared"
import { publicConfig } from "@/config.public"

const baseUrl = publicConfig.apiEndpoint

export default async function fetchInserJeunesStats(training: ILbaItemFormation2Json) {
  if (!training) {
    return null
  }
  try {
    const response = await fetch(`${baseUrl}/inserjeunes/${training.place.zipCode}/${training.training.cfd}`)
    if (!response.ok) {
      return null
    }
    return response.json()
  } catch {
    return null
  }
}
