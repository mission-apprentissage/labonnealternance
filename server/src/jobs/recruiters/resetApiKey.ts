import { randomUUID } from "crypto"

import { logger } from "../../common/logger"
import { getDbCollection } from "../../common/utils/mongodbUtils"

export const resetApiKey = async (email) => {
  const updatedUser = await getDbCollection("credentials").findOneAndUpdate({ email }, { $set: { api_key: `mna-${randomUUID()}` } }, { returnDocument: "after" })
  logger.info(`API-KEY : ${updatedUser?.api_key}`)
}
