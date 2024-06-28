import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"

/**
 * Anonymize users older than 1 year.
 */
const anonymizeUsers = async () => {
  logger.info(`Début anonymisation`)

  const lastYear = new Date()
  lastYear.setFullYear(lastYear.getFullYear() - 1)
  const matchCondition = { last_action_date: { $lte: lastYear } }

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
        // @ts-ignore
        $merge: "anonymized_users",
      },
    ])
    .toArray()

  const res = await getDbCollection("users").deleteMany(matchCondition)

  return res.deletedCount
}

export const anonymizeOldUsers = async () => {
  try {
    logger.info(" -- Anonymisation des utilisateurs non modifiés de plus de un (1) an -- ")

    const anonymizedUserCount = await anonymizeUsers()

    logger.info(`Fin traitement ${anonymizedUserCount}`)

    await notifyToSlack({
      subject: "ANONYMISATION USERS",
      message: `Anonymisation des users non modifiés depuis plus de un an terminée. ${anonymizedUserCount} user(s) anonymisée(s).`,
      error: false,
    })
  } catch (err: any) {
    await notifyToSlack({ subject: "ANONYMISATION USERS", message: `ECHEC anonymisation des users`, error: true })
    throw err
  }
}
