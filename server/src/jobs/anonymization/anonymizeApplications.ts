import { logger } from "../../common/logger"
import { getDbCollection } from "../../common/utils/mongodbUtils"
import { notifyToSlack } from "../../common/utils/slackUtils"

export const anonymizeApplicationProjection = {
  company_recruitment_intention: 1,
  company_feedback_date: 1,
  company_siret: 1,
  company_naf: 1,
  job_origin: 1,
  job_id: 1,
  caller: 1,
  created_at: 1,
  applicant_id: 1,
}

const anonymize = async () => {
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
        $project: anonymizeApplicationProjection,
      },
      {
        $merge: "anonymizedapplications",
      },
    ])
    .toArray()

  const res = await getDbCollection("applications").deleteMany(matchCondition)

  return res.deletedCount
}

export const anonymizeApplications = async function () {
  try {
    logger.info("[START] Anonymisation des candidatures de plus de deux (2) ans")

    const anonymizedApplicationCount = await anonymize()

    await notifyToSlack({
      subject: "ANONYMISATION CANDIDATURES",
      message: `Anonymisation des candidatures de plus de deux (2) an terminée. ${anonymizedApplicationCount} candidature(s) anonymisée(s).`,
    })
  } catch (err: any) {
    await notifyToSlack({ subject: "ANONYMISATION CANDIDATURES", message: `ECHEC anonymisation des candidatures`, error: true })
    throw err
  }
  logger.info("[END] Anonymisation des candidatures de plus de deux (2) ans")
}
