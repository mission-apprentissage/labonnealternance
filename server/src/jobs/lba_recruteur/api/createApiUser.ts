import { randomUUID } from "crypto"

import { ObjectId } from "mongodb"
import { ICredential } from "shared/models"

import { logger } from "../../../common/logger"
import { getDbCollection } from "../../../common/utils/mongodbUtils"

export const createApiUser = async (
  nom: ICredential["nom"],
  prenom: ICredential["prenom"],
  email: ICredential["email"],
  organisation: ICredential["organisation"],
  scope: ICredential["scope"]
) => {
  const now = new Date()
  const newUser: ICredential = {
    _id: new ObjectId(),
    nom,
    prenom,
    email,
    organisation,
    scope,
    actif: true,
    api_key: `mna-${randomUUID()}`,
    createdAt: now,
    updatedAt: now,
  }
  await getDbCollection("credentials").insertOne(newUser)
  logger.info(`API-KEY : ${newUser.api_key}`)
}
