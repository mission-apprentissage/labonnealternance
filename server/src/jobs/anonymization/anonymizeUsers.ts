import anonymizedUsersModel from "shared/models/anonymizedUsers.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"

/**
 * Anonymize users older than 1 year.
 */
const anonymize = async () => {
  const period = new Date()
  period.setFullYear(period.getFullYear() - 2)
  const matchCondition = { last_action_date: { $lte: period } }

  await getDbCollection("users")
    .aggregate([
      {
        $match: matchCondition,
      },
      {
        $project: {
          role: 1,
          type: 1,
          last_action_date: 1,
        },
      },
      {
        $merge: anonymizedUsersModel.collectionName,
      },
    ])
    .toArray()

  const res = await getDbCollection("users").deleteMany(matchCondition)

  return res.deletedCount
}

export const anonymizeUsers = async () => {
  logger.info("[START] Anonymisation des utilisateurs non modifiés de plus de deux (2) ans")
  try {
    const anonymizedUserCount = await anonymize()

    await notifyToSlack({
      subject: "ANONYMISATION USERS",
      message: `Anonymisation des users non modifiés depuis plus de un an terminée. ${anonymizedUserCount} user(s) anonymisée(s).`,
    })
  } catch (err: any) {
    await notifyToSlack({ subject: "ANONYMISATION USERS", message: `ECHEC anonymisation des users`, error: true })
    throw err
  }
  logger.info("[END] Anonymisation des utilisateurs non modifiés de plus de deux (2) ans")
}
