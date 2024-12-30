import anonymizedApplicantModel from "shared/models/anonymizedApplicant.model"
import anonymizedApplicationsModel from "shared/models/anonymizedApplications.model"

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
      {
        $merge: anonymizedApplicantModel.collectionName,
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
      {
        $merge: anonymizedApplicationsModel.collectionName,
      },
    ])
    .toArray()

  const applicantsIdsToDelete = matchedApplicants.map((doc) => doc._id)
  const applicationsIdsToDelete = matchedApplications.map((doc) => doc._id)
  const [resApplications, resApplicants] = await Promise.all([
    getDbCollection("applications").deleteMany({ _id: { $in: applicationsIdsToDelete } }),
    getDbCollection("applicants").deleteMany({ _id: { $in: applicantsIdsToDelete } }),
    // we don't keep archive of applicants_email_logs
    getDbCollection("applicants_email_logs").deleteMany({ applicant_id: { $in: applicantsIdsToDelete } }),
  ])

  return [resApplications, resApplicants]
}

export const anonymizeApplicantsAndApplications = async function () {
  logger.info("[START] Anonymisation des candidats & leurs candidatures de plus de deux (2) ans")
  try {
    const [anonymizedApplication, anonymizedApplicant] = await anonymize()

    await notifyToSlack({
      subject: "ANONYMISATION CANDIDATS & CANDIDATURES",
      message: `Anonymisation des candidats de plus de deux ans terminée. ${anonymizedApplicant.deletedCount} candidat(s) et ${anonymizedApplication.deletedCount} candidature(s) anonymisée(s).`,
    })
  } catch (err: any) {
    await notifyToSlack({ subject: "ANONYMISATION CANDIDATS & CANDIDATURES", message: `ECHEC anonymisation des candidats & candidatures`, error: true })
    throw err
  }
  logger.info("[END] Anonymisation des candidats & leurs candidatures de plus de deux (2) ans")
}
