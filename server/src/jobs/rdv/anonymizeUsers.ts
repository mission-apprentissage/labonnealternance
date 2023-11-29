import { oleoduc, writeData } from "oleoduc"

import { logger } from "@/common/logger"

import { AnonymizedUser, User } from "../../common/model/index"
import dayjs from "../../services/dayjs.service"

/**
 * Anonymize users older than 2 years.
 */
export const anonymizeUsers = async () => {
  logger.info("Cron #anonymizeUsers started.")

  const stats = {
    totalUsersCount: 0,
    afterExecutionUsersCount: 0,
    anonymizedUsersCount: 0,
  }

  const anonymizeUsersOlderThanDate = dayjs().subtract(1, "year").toDate()
  const anonymizeUsersFixedDate = dayjs("2023-03-03").toDate()

  const conditions = {
    $or: [{ last_action_date: { $lte: anonymizeUsersOlderThanDate } }, { last_action_date: { $lte: anonymizeUsersFixedDate } }],
  }

  await oleoduc(
    User.find(conditions).lean().cursor(),
    writeData(
      async (user) => {
        await AnonymizedUser.create({
          userId: user._id,
          type: user.type,
          role: user.role,
          last_action_date: user.last_action_date,
        })
        stats.anonymizedUsersCount++
      },
      { parallel: 100 }
    )
  )

  await User.deleteMany(conditions)

  stats.totalUsersCount = await User.countDocuments()

  logger.info("Cron #anonymizeUsers done.", { stats })

  return stats
}
