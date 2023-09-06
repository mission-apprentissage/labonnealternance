import { logger } from "../../../common/logger"
import { Credential } from "../../../common/model/index"
import { createApiKey } from "../../../services/userRecruteur.service"

export const resetApiKey = async (email) => {
  const updatedUser = await Credential.findOneAndUpdate({ email }, { api_key: createApiKey() }, { new: true })
  logger.info(`API-KEY : ${updatedUser.api_key}`)
}
