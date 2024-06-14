import Boom from "boom"
import { ObjectId } from "mongodb"
import { IUserRecruteur } from "shared/models"
import { ICFA } from "shared/models/cfa.model"
import { IEntreprise } from "shared/models/entreprise.model"

import { Cfa } from "@/common/model"
import { getDbCollection } from "@/common/utils/mongodbUtils"

import { CFA, ENTREPRISE } from "./constant.service"

export const createOrganizationIfNotExist = async (organization: Omit<IUserRecruteur, "_id" | "createdAt" | "updatedAt" | "status">): Promise<IEntreprise | ICFA> => {
  const { address, address_detail, establishment_enseigne, establishment_raison_sociale, establishment_siret, geo_coordinates, idcc, opco, origin, type } = organization

  if (!establishment_siret) {
    throw Boom.internal("siret is missing")
  }
  if (type === ENTREPRISE || type === CFA) {
    let entreprise: IEntreprise | null = await getDbCollection("entreprises").findOne({ siret: establishment_siret })
    if (!entreprise) {
      entreprise = {
        _id: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
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
      await getDbCollection("entreprises").insertOne(entreprise)
    }
    if (type === CFA) {
      let cfa = await Cfa.findOne({ siret: establishment_siret }).lean()
      if (!cfa) {
        const cfaFields: Omit<ICFA, "_id" | "createdAt" | "updatedAt"> = {
          siret: establishment_siret,
          address,
          address_detail,
          enseigne: establishment_enseigne,
          raison_sociale: establishment_raison_sociale,
          origin,
          geo_coordinates,
        }
        cfa = (await Cfa.create(cfaFields)).toObject()
      }
      return cfa
    }
    return entreprise
  } else {
    throw Boom.internal(`type unsupported: ${type}`)
  }
}
