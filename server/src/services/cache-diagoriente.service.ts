import { ObjectId } from "mongodb"
import type { IDiagorienteClassificationSchema } from "shared"

import { getDiagorienteRomeClassification } from "@/common/apis/diagoriente/diagoriente.client"
import { getDbCollection } from "@/common/utils/mongodb-utils"

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
      const result = apiResponse[payload.id]?.classify_results[0]?.data
      return result ? { id: payload.id, title: payload.title, sector: payload.sector, intitule_rome: result.titre, code_rome: result.rome } : null
    })
    .filter((x) => x !== null)

  if (mappedApiResponse.length) {
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
  // Indexation par POSITION : cachedRomes est aligné sur `queries`, pas indexé par `id`. L'ancien
  // `cachedRomes[_query.id]` (id = _id Mongo) valait toujours undefined, donc dès qu'un groupe de 100
  // contenait une seule requête hors cache, toutes ses requêtes en cache ressortaient à null et
  // partaient en erreur « data not found » — mesuré en prod : 856 des 2 174 offres du nightly du
  // 02/09/2026, toutes reservies depuis le cache à 06h03 sans appel API.
  return queries.map((query, index) => cachedRomes[index] ?? mappedApiResponse.find(({ id }) => id === query.id)?.code_rome ?? null)
}
