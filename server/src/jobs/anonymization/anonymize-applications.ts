import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"
import { deleteCvFilesForApplications } from "@/services/application-cv.service"
import { notifyCvDeletionFailures } from "./notify-cv-deletion-failures"

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

  // Les CV doivent partir AVANT le $merge et le deleteMany : la clé S3 dérive de applications._id,
  // et la projection ci-dessous ne le conserve pas. Mode dégradé assumé — bloquer sur un échec S3
  // empêcherait la purge de milliers de documents porteurs de données personnelles au-delà de la
  // durée de conservation, ce qui est un manquement plus large qu'un fichier orphelin.
  const cvReport = await deleteCvFilesForApplications(matchCondition, { context: "anonymize-applications" })

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

  return { deletedCount: res.deletedCount, cvReport }
}

/**
 * règle métier : vient en complément de anonymizeApplicantAndApplications
 * on anonymise les candidatures de plus de 2 ans (et pas seulement celles des candidats n'ayant pas eu de connexion depuis 2 ans)
 */
export const anonymizeApplications = async function () {
  try {
    logger.info("[START] Anonymisation des candidatures de plus de deux (2) ans")

    const { deletedCount, cvReport } = await anonymize()

    await notifyToSlack({
      subject: "ANONYMISATION CANDIDATURES",
      message: `Anonymisation des candidatures de plus de deux (2) an terminée. ${deletedCount} candidature(s) anonymisée(s). ${cvReport.deleted} CV supprimé(s) de S3.`,
    })

    await notifyCvDeletionFailures("ANONYMISATION CANDIDATURES", cvReport)
  } catch (err: any) {
    await notifyToSlack({ subject: "ANONYMISATION CANDIDATURES", message: `ECHEC anonymisation des candidatures`, error: true })
    throw err
  }
  logger.info("[END] Anonymisation des candidatures de plus de deux (2) ans")
}
