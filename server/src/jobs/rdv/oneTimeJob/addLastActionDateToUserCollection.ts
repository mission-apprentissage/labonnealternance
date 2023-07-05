import dayjs from "../../../common/dayjs.js"
import { User } from "../../../db/index.js"
import { roles } from "../../../common/roles.js"
import { runScript } from "../../scriptWrapper.js"

export const addLastActionDateToUserCollection = async () => {
  const date = dayjs().format()

  const result = await User.updateMany(
    { role: roles.candidat },
    {
      $set: {
        last_action_date: date,
        is_anonymized: false,
      },
    }
  )

  return result.upserted
}

runScript(async () => await addLastActionDateToUserCollection())
