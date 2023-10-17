import { ICredential } from "shared/models"

import { logger } from "../../../common/logger"
import { Credential } from "../../../common/model/index"

export const disableApiUser = async (email: ICredential["email"], state: ICredential["actif"] = false) => {
  const updatedUser = await Credential.findOneAndUpdate({ email }, { actif: state }, { new: true })

  logger.info(`User ${updatedUser?.email} disabled — API state : ${updatedUser?.actif}`)
}
