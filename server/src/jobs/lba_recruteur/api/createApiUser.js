import { logger } from "../../../common/logger.js"
import { Credential } from "../../../common/model/index.js"

export const createApiUser = async (nom, prenom, email, organisation, scope) => {
  const apiUser = await Credential.create({ nom, prenom, email, organisation, scope })
  logger.info(`API-KEY : ${apiUser.apiKey}`)
}
