import { ObjectId } from "mongodb"
import { ICFA } from "shared/models/cfa.model"

import { getDbCollection } from "../common/utils/mongodbUtils"

export const upsertCfa = async (siret: string, cfaFields: Omit<ICFA, "_id" | "createdAt" | "updatedAt" | "origin" | "siret">, origin: string): Promise<ICFA> => {
  const now = new Date()
  let cfa = await getDbCollection("cfas").findOne({ siret })
  if (cfa) {
    cfa = await getDbCollection("cfas").findOneAndUpdate({ siret }, { $set: { ...cfaFields, siret } }, { returnDocument: "after" })
    if (!cfa) throw new Error("inattendu: pas de cfa")
    return cfa
  } else {
    const createCfaFields: ICFA = {
      ...cfaFields,
      origin,
      siret,
      _id: new ObjectId(),
      createdAt: now,
      updatedAt: now,
    }
    await getDbCollection("cfas").insertOne(createCfaFields)
    return createCfaFields
  }
}
