import { ObjectId } from "mongodb"
import { ZCacheRomeo, ZRomeoAPIResponse } from "shared/models/cacheRomeo.model"
import { z } from "zod"

import { getRomeoPredictions } from "../common/apis/franceTravail/franceTravail.client"
import { getDbCollection } from "../common/utils/mongodbUtils"

const ZRomeQuery = ZCacheRomeo.pick({
  contexte: true,
  intitule: true,
})

type IRomeQuery = z.output<typeof ZRomeQuery>

const getRomesFromCache = async (queries: IRomeQuery[]): Promise<(string | null)[]> => {
  const results = await getDbCollection("cache_romeo").find({ $or: queries }).toArray()
  return queries.map((query) => {
    return results.find(({ contexte, intitule }) => contexte === query.contexte && intitule === query.intitule)?.metiersRome[0].codeRome ?? null
  })
}

export const getRomeInfoSafe = async (query: IRomeQuery): Promise<string | null> => {
  try {
    const results = await getRomesInfos([query])
    return results[0]
  } catch (error) {
    console.error("Error fetching or processing Romeo data:", error)
    return null
  }
}

export const getRomesInfos = async (queries: IRomeQuery[]): Promise<(string | null)[]> => {
  const cachedRomes = await getRomesFromCache(queries)
  const notFoundQueries = queries.flatMap((query, index) => {
    if (cachedRomes[index] !== null) {
      return []
    }
    const { contexte, intitule } = query
    return [{ intitule, contexte: contexte ?? undefined, identifiant: index.toString() }]
  })
  if (!notFoundQueries.length) {
    return cachedRomes
  }
  const apiResponse = (await getRomeoPredictions(notFoundQueries)) ?? []

  const parsedApiResponse = ZRomeoAPIResponse.parse(apiResponse)
  if (apiResponse.length) {
    await getDbCollection("cache_romeo").insertMany(
      parsedApiResponse.map(({ contexte, intitule, metiersRome }) => ({
        _id: new ObjectId(),
        contexte,
        intitule,
        metiersRome,
      }))
    )
  }
  return queries.map((_query, index) => cachedRomes[index] ?? parsedApiResponse.find(({ identifiant }) => identifiant === index.toString())?.metiersRome[0].codeRome ?? null)
}
