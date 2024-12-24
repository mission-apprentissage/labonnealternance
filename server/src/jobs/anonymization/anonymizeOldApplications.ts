import { logger } from "../../common/logger"
import { getDbCollection } from "../../common/utils/mongodbUtils"
import { notifyToSlack } from "../../common/utils/slackUtils"

const anonymizeApplications = async () => {
  logger.info(`Début anonymisation`)

  const period = new Date()
  period.setFullYear(period.getFullYear() - 2)

  const matchCondition = { created_at: { $lte: period } }

  await getDbCollection("applications")
    .aggregate([
      {
        $match: matchCondition,
      },
      {
        $project: {
          company_recruitment_intention: 1,
          company_feedback_date: 1,
          company_siret: 1,
          company_naf: 1,
          job_origin: 1,
          job_id: 1,
          caller: 1,
          created_at: 1,
        },
      },
      {
        $merge: "anonymizedapplications",
      },
    ])
    .toArray()

  const res = await getDbCollection("applications").deleteMany(matchCondition)

  return res.deletedCount
}

export const anonymizeOldApplications = async function () {
  try {
    logger.info(" -- Anonymisation des candidatures de plus de deux (2) ans -- ")

    const anonymizedApplicationCount = await anonymizeApplications()

    logger.info(`Fin traitement ${anonymizedApplicationCount}`)

    await notifyToSlack({
      subject: "ANONYMISATION CANDIDATURES",
      message: `Anonymisation des candidatures de plus de un an terminée. ${anonymizedApplicationCount} candidature(s) anonymisée(s).`,
      error: false,
    })
  } catch (err: any) {
    await notifyToSlack({ subject: "ANONYMISATION CANDIDATURES", message: `ECHEC anonymisation des candidatures`, error: true })
    throw err
  }
}

export default anonymizeOldApplications
