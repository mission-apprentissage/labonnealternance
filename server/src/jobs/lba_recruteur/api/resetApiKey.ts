import { logger } from "../../../common/logger.js"
import { Credential } from "../../../common/model/index.js"

export const resetApiKey = async (users, email) => {
  const updatedUser = await Credential.findOneAndUpdate({ email }, { api_key: users.createApiKey() }, { new: true })
  logger.info(`API-KEY : ${updatedUser.apiKey}`)
}
