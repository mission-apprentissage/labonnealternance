import { ObjectId } from "mongodb"
import { ZRomeoApiResponse } from "shared/models/cacheRomeo.model"

import { IRomeoPayload, getRomeoPredictions } from "../common/apis/franceTravail/franceTravail.client"
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
  const data = ZRomeoApiResponse.parse(response)
  await getDbCollection("cache_romeo").insertMany(data.map((d) => ({ ...d, _id: new ObjectId() })))
  return data[0].metiersRome[0].codeRome
}
