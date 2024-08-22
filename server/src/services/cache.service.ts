import { ZRomeoApiResponse } from "shared/models/cacheRomeo.model"

import { IRomeoPayload, getRomeoPredictions } from "../common/apis/FranceTravail"
import { getDbCollection } from "../common/utils/mongodbUtils"

export const getRomeoInfos = async ({ intitule, contexte }: { intitule: string; contexte?: string }): Promise<string | null> => {
  const cacheEntry = await getDbCollection("cache_romeo").findOne({ $text: { $search: intitule } })
  if (cacheEntry) {
    return cacheEntry.metiersRome[0].codeRome
  }
  const romeoPayload: IRomeoPayload[] = [{ intitule, contexte, identifiant: "1" }]
  const response = await getRomeoPredictions(romeoPayload)
  if (!response) {
    return null
  }
  await ZRomeoApiResponse.parse(response)
  await getDbCollection("cache_romeo").insertMany(response)
  return response[0].metiersRome[0].codeRome
}
