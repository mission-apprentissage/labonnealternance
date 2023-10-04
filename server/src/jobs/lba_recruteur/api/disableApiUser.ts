import { logger } from "../../../common/logger"
import { Credential } from "../../../common/model/index"

export const disableApiUser = async (email, state = false) => {
  const updatedUser = await Credential.findOneAndUpdate({ email }, { actif: state }, { new: true })

  logger.info(`User ${updatedUser?.email} disabled — API state : ${updatedUser?.actif}`)
}
