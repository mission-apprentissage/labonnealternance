//@ts-nocheck
import { get } from "lodash-es"
import { logger } from "../../common/logger.js"
import { Application } from "../../common/model/index.js"
import { sentryCaptureException } from "../../common/utils/sentryUtils.js"
import { notifyToSlack } from "../../common/utils/slackUtils.js"

const anonymizeApplications = async () => {
  logger.info(`Début anonymisation`)

  const lastYear = new Date()
  lastYear.setFullYear(lastYear.getFullYear() - 1)

  const res = await Application.updateMany(
    { created_at: { $lte: lastYear }, is_anonymized: { $ne: true } },
    {
      $set: {
        is_anonymized: true,
        last_update_at: new Date(),
        applicant_email: null,
        applicant_first_name: null,
        applicant_last_name: null,
        applicant_phone: null,
        applicant_attachment_name: null,
        applicant_message_to_company: null,
        company_feedback: null,
        company_email: null,
        company_name: null,
        company_siret: null,
        company_address: null,
        job_title: null,
        job_id: null,
        to_applicant_message_id: null,
        to_company_message_id: null,
      },
    }
  )

  return res.nModified
}

export default async function () {
  try {
    logger.info(" -- Anonymisation des candidatures de plus de un (1) an -- ")

    const nModified = await anonymizeApplications()

    logger.info(`Fin traitement ${nModified}`)

    await notifyToSlack({
      subject: "ANONYMISATION CANDIDATURES",
      message: `Anonymisation des candidatures de plus de un an terminée. ${nModified} candidature(s) anonymisée(s).`,
      error: false,
    })

    return {
      result: "Anonymisation des candidatures terminée",
    }
  } catch (err) {
    sentryCaptureException(err)
    logger.error(err)
    const error_msg = get(err, "meta.body") ?? err.message
    await notifyToSlack({ subject: "ANONYMISATION CANDIDATURES", message: `ECHEC anonymisation des candidatures ${error_msg}`, error: true })
    return { error: error_msg }
  }
}
