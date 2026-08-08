import type { ICredential } from "shared/models/index"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"

export const disableApiUser = async (email: ICredential["email"], state: ICredential["actif"] = false) => {
  const updatedUser = await getDbCollection("credentials").findOneAndUpdate({ email }, { $set: { actif: state } }, { returnDocument: "after" })

  logger.info(`User ${updatedUser?.email} disabled — API state : ${updatedUser?.actif}`)
}
