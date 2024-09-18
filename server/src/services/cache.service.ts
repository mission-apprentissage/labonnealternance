import { ObjectId } from "mongodb"
import { ICacheRomeo, IRomeoAPIModel, ZRomeoAPIResponse } from "shared/models/cacheRomeo.model"

import { IRomeoPayload, getRomeoPredictions } from "../common/apis/franceTravail/franceTravail.client"
import { getDbCollection } from "../common/utils/mongodbUtils"

interface GetRomeFromRomeoParams {
  intitule: string
  contexte?: string
}

const getRomeFromCache = async (intitule: string): Promise<string | null> => {
  const cacheEntry = await getDbCollection("cache_romeo").findOne({ intitule })
  return cacheEntry ? cacheEntry.metiersRome[0].codeRome : null
}

const formatRomeoResponse = (intitule: string, contexte: string | undefined, romeoApiResponse: any): ICacheRomeo[] => {
  return romeoApiResponse.map((romeo: IRomeoAPIModel) => ({
    _id: new ObjectId(),
    intitule: `${intitule} ${contexte}`,
    metiersRome: romeo.metiersRome,
  }))
}

export const getRomeFromRomeo = async ({ intitule, contexte }: GetRomeFromRomeoParams): Promise<string | null> => {
  try {
    const cachedRome = await getRomeFromCache(intitule)
    if (cachedRome) {
      return cachedRome
    }

    const romeoPayload: IRomeoPayload[] = [{ intitule, contexte, identifiant: "1" }]
    const response = await getRomeoPredictions(romeoPayload)
    if (!response) {
      return null
    }

    const romeoApiResponse = ZRomeoAPIResponse.parse(response)
    const formattedRomeoResponse = formatRomeoResponse(intitule, contexte, romeoApiResponse)

    await getDbCollection("cache_romeo").insertMany(formattedRomeoResponse)

    return romeoApiResponse[0].metiersRome[0].codeRome
  } catch (error) {
    console.error("Error fetching or processing Romeo data:", error)
    return null
  }
}
