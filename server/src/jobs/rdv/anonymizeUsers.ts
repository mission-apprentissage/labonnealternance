import { logger } from "../../common/logger.js"
import { User } from "../../common/model/index.js"

export const anonimizeUsers = async () => {
  logger.info("job #anonimizeUsers start")
  const archiveThreshold = new Date()
  archiveThreshold.setFullYear(archiveThreshold.getFullYear() - 1)

  const result = await User.updateMany(
    { last_action_date: { $lte: archiveThreshold } },
    {
      $set: {
        username: null,
        password: null,
        firstname: null,
        lastname: null,
        phone: null,
        email: null,
        role: null,
        is_anonymized: true,
      },
    }
  )
  logger.info("job #anonimizeUsers done")

  return result
}
