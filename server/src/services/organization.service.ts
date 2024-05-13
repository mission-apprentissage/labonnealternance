import Boom from "boom"
import { ICFA } from "shared/models/cfa.model"
import { IEntreprise } from "shared/models/entreprise.model"
import { SetOptional } from "type-fest"

import { Cfa, Entreprise } from "@/common/model"

import { CFA, ENTREPRISE } from "./constant.service"
import { EntrepriseData } from "./etablissement.service"

export const upsertOrganization = async (
  entrepriseData: Pick<
    SetOptional<EntrepriseData, "idcc" | "opco">,
    "address" | "address_detail" | "establishment_enseigne" | "establishment_raison_sociale" | "establishment_siret" | "geo_coordinates" | "idcc" | "opco"
  >,
  origin: string,
  type: typeof CFA | typeof ENTREPRISE
): Promise<IEntreprise | ICFA> => {
  const { address, address_detail, establishment_enseigne, establishment_raison_sociale, establishment_siret, geo_coordinates, idcc, opco } = entrepriseData

  if (!establishment_siret) {
    throw Boom.internal("siret is missing")
  }
  const entrepriseFields = {
    siret: establishment_siret,
    address,
    address_detail,
    enseigne: establishment_enseigne,
    raison_sociale: establishment_raison_sociale,
    geo_coordinates,
    ...(opco ? { opco } : {}),
    ...(idcc ? { idcc } : {}),
  } satisfies Partial<IEntreprise>
  let entreprise = await Entreprise.findOne({ siret: establishment_siret }).lean()
  if (entreprise) {
    entreprise = await Entreprise.findOneAndUpdate({ siret: establishment_siret }, { $set: entrepriseFields }, { new: true }).lean()
    if (!entreprise) throw new Error("inattendu: pas d'entreprise")
  } else {
    const createEntrepriseFields: Omit<IEntreprise, "_id" | "createdAt" | "updatedAt"> = {
      ...entrepriseFields,
      opco,
      idcc,
      origin,
      status: [],
    }
    entreprise = (await Entreprise.create(createEntrepriseFields)).toObject()
  }
  if (type === CFA) {
    const cfaFields = {
      siret: establishment_siret,
      address,
      address_detail,
      enseigne: establishment_enseigne,
      raison_sociale: establishment_raison_sociale,
      geo_coordinates,
    } satisfies Partial<ICFA>
    let cfa = await Cfa.findOne({ siret: establishment_siret }).lean()
    if (cfa) {
      cfa = await Cfa.updateOne({ siret: establishment_siret }, { $set: cfaFields }, { new: true }).lean()
      if (!cfa) throw new Error("inattendu: pas de cfa")
    } else {
      const createCfaFields: Omit<ICFA, "_id" | "createdAt" | "updatedAt"> = {
        ...cfaFields,
        origin,
      }
      cfa = (await Cfa.create(createCfaFields)).toObject()
    }
    return cfa
  }
  return entreprise
}
