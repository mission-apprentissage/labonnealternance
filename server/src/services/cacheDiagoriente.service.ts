import { ObjectId } from "mongodb"
import type { IDiagorienteClassificationSchema } from "shared"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { getDiagorienteRomeClassification } from "@/common/apis/diagoriente/diagoriente.client"


const getRomesFromCacheDiagoriente = async (queries: IDiagorienteClassificationSchema[]): Promise<(string | null)[]> => {
  const filteredQueries = queries.flatMap(({ title, sector }) => ({ title, sector }))
  const results = await getDbCollection("cache_diagoriente").find({ $or: filteredQueries }).toArray()
  return queries.map((query) => {
    return results.find(({ title, sector }) => title === query.title && sector === query.sector)?.code_rome ?? null
  })
}

export const getRomesInfosFromDiagoriente = async (queries: IDiagorienteClassificationSchema[]): Promise<(string | null)[]> => {
  const cachedRomes = await getRomesFromCacheDiagoriente(queries)
  const notFoundQueries = queries.flatMap((query, index) => {
    if (cachedRomes[index] !== null) {
      return []
    }
    const { title, sector, description, id } = query
    return [{ title, sector, description, id }]
  })
  if (!notFoundQueries.length) {
    return cachedRomes
  }
  const apiResponse = (await getDiagorienteRomeClassification(notFoundQueries)) ?? []
  const mappedApiResponse = notFoundQueries
    .map((payload) => {
      const result = apiResponse.find(({ job_offer_id, code_rome, intitule_rome }) => job_offer_id === payload.id && code_rome !== null && intitule_rome !== null)
      return result ? { id: payload.id, title: payload.title, sector: payload.sector, intitule_rome: result.intitule_rome, code_rome: result.code_rome } : null
    })
    .filter((x) => x !== null)

  if (apiResponse.length) {
    await getDbCollection("cache_diagoriente").insertMany(
      mappedApiResponse.map((result) => ({
        _id: new ObjectId(),
        title: result.title,
        sector: result.sector,
        intitule_rome: result.intitule_rome,
        code_rome: result.code_rome,
      }))
    )
  }
  return queries.map((_query) => cachedRomes[_query.id] ?? mappedApiResponse.find(({ id }) => id === _query.id)?.code_rome ?? null)
}
