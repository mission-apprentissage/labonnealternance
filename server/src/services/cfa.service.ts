import { ObjectId } from "mongodb"
import type { ICFA } from "shared/models/cfa.model"

import { getDbCollection } from "@/common/utils/mongodbUtils"

export const upsertCfa = async (siret: string, cfaFields: Omit<ICFA, "_id" | "createdAt" | "updatedAt" | "origin" | "siret">, origin: string): Promise<ICFA> => {
  const now = new Date()
  const cfa = await getDbCollection("cfas").findOneAndUpdate(
    { siret },
    {
      $set: { ...cfaFields, siret, updatedAt: now },
      $setOnInsert: { _id: new ObjectId(), createdAt: now, origin },
    },
    { upsert: true, returnDocument: "after" }
  )
  if (!cfa) throw new Error("inattendu: pas de cfa")
  return cfa
}
