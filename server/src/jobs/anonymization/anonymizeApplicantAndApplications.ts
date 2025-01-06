import { logger } from "../../common/logger"
import { getDbCollection } from "../../common/utils/mongodbUtils"
import { notifyToSlack } from "../../common/utils/slackUtils"

const anonymize = async () => {
  const period = new Date()
  period.setFullYear(period.getFullYear() - 2)

  const matchCondition = { last_connection: { $lte: period } }

  const matchedApplicants = await getDbCollection("applicants")
    .aggregate([
      {
        $match: matchCondition,
      },
      {
        $project: {
          _id: 0,
          applicant_id: "$_id",
          createdAt: 1,
        },
      },
    ])
    .toArray()

  const matchedApplications = await getDbCollection("applications")
    .aggregate([
      {
        $lookup: {
          from: "applicants",
          localField: "applicant_id",
          foreignField: "_id",
          as: "applicant",
        },
      },
      {
        $match: {
          "applicant.last_connection": { $lte: period },
        },
      },
      {
        $project: {
          _id: 0,
          company_recruitment_intention: 1,
          company_feedback_date: 1,
          company_siret: 1,
          company_naf: 1,
          job_origin: 1,
          job_id: 1,
          caller: 1,
          created_at: 1,
          applicant_id: 1,
        },
      },
    ])
    .toArray()

  await getDbCollection("anonymized_applicants").insertMany(matchedApplicants)
  await getDbCollection("anonymized_applications").insertMany(matchedApplications)
  const applicantsIdsToDelete = matchedApplicants.map((doc) => doc.applicant_id)
  const applicationsIdsToDelete = matchedApplications.map((doc) => doc.applicant_id)
  const [resApplications, resApplicants] = await Promise.all([
    getDbCollection("applications").deleteMany({ applicant_id: { $in: applicationsIdsToDelete } }),
    getDbCollection("applicants").deleteMany({ _id: { $in: applicantsIdsToDelete } }),
    // we don't keep archive of applicants_email_logs
    getDbCollection("applicants_email_logs").deleteMany({ applicant_id: { $in: applicantsIdsToDelete } }),
  ])

  return { deletedApplication: resApplications.deletedCount, deletedApplicants: resApplicants.deletedCount }
}

export const anonymizeApplicantsAndApplications = async function () {
  logger.info("[START] Anonymisation des candidats & leurs candidatures de plus de deux (2) ans")
  try {
    const { deletedApplicants, deletedApplication } = await anonymize()

    await notifyToSlack({
      subject: "ANONYMISATION CANDIDATS & CANDIDATURES",
      message: `Anonymisation des candidats de plus de deux ans terminée. ${deletedApplicants} candidat(s) et ${deletedApplication} candidature(s) anonymisée(s).`,
    })
  } catch (err: any) {
    await notifyToSlack({ subject: "ANONYMISATION CANDIDATS & CANDIDATURES", message: `ECHEC anonymisation des candidats & candidatures`, error: true })
    throw err
  }
  logger.info("[END] Anonymisation des candidats & leurs candidatures de plus de deux (2) ans")
}
