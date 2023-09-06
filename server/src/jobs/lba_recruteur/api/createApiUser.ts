import { logger } from "../../../common/logger"
import { Credential } from "../../../common/model/index"

export const createApiUser = async (nom, prenom, email, organisation, scope) => {
  const apiUser = await Credential.create({ nom, prenom, email, organisation, scope })
  logger.info(`API-KEY : ${apiUser.api_key}`)
}
