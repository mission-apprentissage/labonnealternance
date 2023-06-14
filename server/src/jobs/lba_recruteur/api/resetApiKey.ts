import { logger } from "../../../common/logger.js"
import { Credential } from "../../../common/model/index.js"
import { createApiKey } from "../../../services/userRecruteur.service.js"

export const resetApiKey = async (email) => {
  const updatedUser = await Credential.findOneAndUpdate({ email }, { api_key: createApiKey() }, { new: true })
  logger.info(`API-KEY : ${updatedUser.api_key}`)
}
