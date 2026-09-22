import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"
import { deleteCvFilesForApplications, emptyCvDeletionReport } from "@/services/application-cv.service"
import { notifyCvDeletionFailures } from "./notify-cv-deletion-failures"

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

  if (!matchedApplicants.length) return { deletedApplication: 0, deletedApplicants: 0, cvReport: emptyCvDeletionReport() }

  const applicantsIdsToDelete = matchedApplicants.map((doc) => doc.applicant_id)

  // Les CV doivent partir AVANT les écritures d'anonymisation et le deleteMany : la clé S3 dérive
  // de applications._id, que la projection ci-dessous efface (_id: 0). Mode dégradé assumé, même
  // raison que dans anonymize-applications.
  const cvReport = await deleteCvFilesForApplications({ applicant_id: { $in: applicantsIdsToDelete } }, { context: "anonymize-applicant-and-applications" })

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
  // insertMany([]) lève : le cas se produit dès qu'un candidat inactif depuis 2 ans a déjà vu ses
  // candidatures supprimées par le cron de 15 0, dix minutes plus tôt.
  if (matchedApplications.length) {
    await getDbCollection("anonymized_applications").insertMany(matchedApplications)
  }
  const [resApplications, resApplicants] = await Promise.all([
    // Même filtre que la purge des CV ci-dessus. Équivalent à l'ancien filtre, qui utilisait déjà
    // des applicant_id (matchedApplications les projette sous ce nom), à ceci près qu'il portait
    // sur un sous-ensemble : les applicants en plus ici n'ont par construction aucune candidature.
    getDbCollection("applications").deleteMany({ applicant_id: { $in: applicantsIdsToDelete } }),
    getDbCollection("applicants").deleteMany({ _id: { $in: applicantsIdsToDelete } }),
    // we don't keep archive of applicants_email_logs
    getDbCollection("applicants_email_logs").deleteMany({ applicant_id: { $in: applicantsIdsToDelete } }),
  ])

  return { deletedApplication: resApplications.deletedCount, deletedApplicants: resApplicants.deletedCount, cvReport }
}

export const anonymizeApplicantsAndApplications = async function () {
  logger.info("[START] Anonymisation des candidats & leurs candidatures de plus de deux (2) ans")
  try {
    const { deletedApplicants, deletedApplication, cvReport } = await anonymize()

    await notifyToSlack({
      subject: "ANONYMISATION CANDIDATS & CANDIDATURES",
      message: `Anonymisation des candidats de plus de deux ans terminée. ${deletedApplicants} candidat(s) et ${deletedApplication} candidature(s) anonymisée(s). ${cvReport.deleted} CV supprimé(s) de S3.`,
    })

    await notifyCvDeletionFailures("ANONYMISATION CANDIDATS & CANDIDATURES", cvReport)
  } catch (err: any) {
    await notifyToSlack({ subject: "ANONYMISATION CANDIDATS & CANDIDATURES", message: `ECHEC anonymisation des candidats & candidatures`, error: true })
    throw err
  }
  logger.info("[END] Anonymisation des candidats & leurs candidatures de plus de deux (2) ans")
}
