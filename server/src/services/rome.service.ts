import { getDbCollection } from "@/common/utils/mongodbUtils"

export const getRomeDetailsFromDB = async (romeCode: string) =>
  getDbCollection("referentielromes").findOne(
    { "rome.code_rome": romeCode },
    {
      projection: {
        _id: 0,
      },
    }
  )
export const getFicheMetierFromDB = async ({ query }) => getDbCollection("referentielromes").findOne(query)
