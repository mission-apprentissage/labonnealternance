import { EApplicantRole } from "shared/constants/rdva"

import { User } from "../../../common/model/index"
import dayjs from "../../../services/dayjs.service"
import { runScript } from "../../scriptWrapper"

export const addLastActionDateToUserCollection = async () => {
  const date = dayjs().format()

  const result = await User.updateMany(
    { role: EApplicantRole.CANDIDAT },
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
