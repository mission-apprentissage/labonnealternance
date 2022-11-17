import { logger } from "../../../common/logger.js"
import { Credential } from "../../../common/model/index.js"

export const resetApiKey = async (users, email) => {
  const apiKey = await users.createApiKey()
  const updatedUser = await Credential.findOneAndUpdate({ email }, { apiKey }, { new: true })

  logger.info(`API-KEY : ${updatedUser.apiKey}`)
}
