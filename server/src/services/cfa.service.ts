import { ICFA } from "shared/models/cfa.model"

import { Cfa } from "@/common/model"

export const upsertCfa = async (siret: string, cfaFields: Omit<ICFA, "_id" | "createdAt" | "updatedAt" | "origin" | "siret">, origin: string): Promise<ICFA> => {
  let cfa = await Cfa.findOne({ siret }).lean()
  if (cfa) {
    cfa = await Cfa.updateOne({ siret }, { $set: { ...cfaFields, siret } }, { new: true }).lean()
    if (!cfa) throw new Error("inattendu: pas de cfa")
  } else {
    const createCfaFields: Omit<ICFA, "_id" | "createdAt" | "updatedAt"> = {
      ...cfaFields,
      origin,
      siret,
    }
    cfa = (await Cfa.create(createCfaFields)).toObject()
  }
  return cfa
}
