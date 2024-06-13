import Boom from "boom"
import { ObjectId } from "mongodb"
import { IUserRecruteur } from "shared/models"
import { ICFA } from "shared/models/cfa.model"
import { IEntreprise } from "shared/models/entreprise.model"

import { Entreprise } from "@/common/model"

import { getDbCollection } from "../common/utils/mongodbUtils"

import { CFA, ENTREPRISE } from "./constant.service"

export const createOrganizationIfNotExist = async (organization: Omit<IUserRecruteur, "_id" | "createdAt" | "updatedAt" | "status">): Promise<IEntreprise | ICFA> => {
  const { address, address_detail, establishment_enseigne, establishment_raison_sociale, establishment_siret, geo_coordinates, idcc, opco, origin, type } = organization

  if (!establishment_siret) {
    throw Boom.internal("siret is missing")
  }
  if (type === ENTREPRISE || type === CFA) {
    let entreprise = await Entreprise.findOne({ siret: establishment_siret }).lean()
    if (!entreprise) {
      const entrepriseFields: Omit<IEntreprise, "_id" | "createdAt" | "updatedAt"> = {
        siret: establishment_siret,
        address,
        address_detail,
        enseigne: establishment_enseigne,
        raison_sociale: establishment_raison_sociale,
        origin,
        opco,
        idcc,
        geo_coordinates,
        status: [],
      }
      entreprise = (await Entreprise.create(entrepriseFields)).toObject()
    }
    if (type === CFA) {
      const cfa = await getDbCollection("cfas").findOne({ siret: establishment_siret })
      if (cfa) return cfa
      const now = new Date()
      const newCfa: ICFA = {
        _id: new ObjectId(),
        createdAt: now,
        updatedAt: now,
        siret: establishment_siret,
        address,
        address_detail,
        enseigne: establishment_enseigne,
        raison_sociale: establishment_raison_sociale,
        origin,
        geo_coordinates,
      }
      await getDbCollection("cfas").insertOne(newCfa)
      return newCfa
    }
    return entreprise
  } else {
    throw Boom.internal(`type unsupported: ${type}`)
  }
}
