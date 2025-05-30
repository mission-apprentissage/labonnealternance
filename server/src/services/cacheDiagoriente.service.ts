import { ObjectId } from "mongodb"
import { IDiagorienteClassificationSchema } from "shared"

import { getDiagorienteRomeClassification } from "@/common/apis/diagoriente/diagoriente.client"

import { getDbCollection } from "../common/utils/mongodbUtils"

const getRomesFromCacheDiagoriente = async (queries: IDiagorienteClassificationSchema[]): Promise<(string | null)[]> => {
  const results = await getDbCollection("cache_diagoriente").find({ $or: queries }).toArray()
  return queries.map((query) => {
    return results.find(({ title, sector }) => title === query.title && sector === query.sector)?.code_rome ?? null
  })
}

export const getRomesInfosFromDiagoriente = async (queries: IDiagorienteClassificationSchema[]): Promise<(string | null)[]> => {
  const cachedRomes = await getRomesFromCacheDiagoriente(queries)
  const notFoundQueries = queries.flatMap((query) => {
    if (cachedRomes[query.id] !== null) {
      return []
    }
    const { title, sector, description, id } = query
    return [{ title, sector: sector ?? "", description: description ?? "", id }]
  })
  if (!notFoundQueries.length) {
    return cachedRomes
  }
  const apiResponse = (await getDiagorienteRomeClassification(notFoundQueries)) ?? []

  const mappedApiResponse = notFoundQueries
    .map((payload) => {
      const result = apiResponse.find(({ job_offer_id }) => job_offer_id === payload.id)
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
