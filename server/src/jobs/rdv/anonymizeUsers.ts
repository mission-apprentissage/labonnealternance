import { oleoduc, writeData } from "oleoduc"

import { logger } from "@/common/logger"
import { IUser } from "@/common/model/schema/user/user.types"

import { AnonymizedUser, User } from "../../common/model/index"
import dayjs from "../../services/dayjs.service"

/**
 * Anonymize users older than 2 years.
 */
export const anonymizeUsers = async () => {
  logger.info("Cron #anonymizeUsers started.")

  const stats = {
    AncientUsersCount: 0,
    NewUsersCount: 0,
  }

  stats.AncientUsersCount = await User.countDocuments()

  const anonymizeUsersOlderThanDate = dayjs().subtract(2, "years").format("YYYY-MM-DD")

  await oleoduc(
    User.find({ created_at: { $lte: anonymizeUsersOlderThanDate } })
      .lean()
      .cursor(),
    writeData(
      async (user: IUser) => {
        await AnonymizedUser.create({
          userId: user._id,
          type: user.type,
          role: user.role,
          last_action_date: user.last_action_date,
        })
      },
      { parallel: 100 }
    )
  )

  await User.deleteMany({ created_at: { $lte: anonymizeUsersOlderThanDate } })

  stats.AncientUsersCount = await User.countDocuments()

  logger.info("Cron #anonymizeUsers done.")

  return stats
}
