import dayjs from "../../../common/dayjs.js"
import { logger } from "../../../common/logger.js"
import { User } from "../../../common/model/index.js"
import { roles } from "../../../common/roles.js"
import { runScript } from "../../scriptWrapper.js"

export const anonymizeUsers = async () => {
  logger.info("job #anonimizeUsers start")
  const archiveThreshold = new Date()
  archiveThreshold.setFullYear(archiveThreshold.getFullYear() - 1)

  const date = dayjs().format()

  const result = await User.updateMany(
    { role: roles.candidat },
    {
      $set: {
        last_action_date: date,
      },
    }
  )
  logger.info("job #anonimizeUsers done")

  return result.upserted
}

runScript(async () => await anonymizeUsers())
