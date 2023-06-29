import dayjs from "../../../common/dayjs.js"
import { User } from "../../../common/model/index.js"
import { ROLES } from "../../../services/constant.service.js"
import { runScript } from "../../scriptWrapper.js"

export const addLastActionDateToUserCollection = async () => {
  const date = dayjs().format()

  const result = await User.updateMany(
    { role: ROLES.candidat },
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
