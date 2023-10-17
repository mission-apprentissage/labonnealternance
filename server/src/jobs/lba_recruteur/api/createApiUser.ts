import { ICredential } from "shared/models"

import { logger } from "../../../common/logger"
import { Credential } from "../../../common/model/index"

export const createApiUser = async (
  nom: ICredential["nom"],
  prenom: ICredential["prenom"],
  email: ICredential["email"],
  organisation: ICredential["organisation"],
  scope: ICredential["scope"]
) => {
  const apiUser = await Credential.create({ nom, prenom, email, organisation, scope })
  logger.info(`API-KEY : ${apiUser.api_key}`)
}
