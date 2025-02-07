import { CompanyFeebackSendStatus } from "shared/models"

import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  await getDbCollection("applications").updateMany(
    {},
    {
      $set: {
        company_recruitment_intention_date: null,
        company_feedback_send_status: null,
      },
    }
  )

  await getDbCollection("applicants_email_logs").updateMany(
    {},
    {
      $set: {
        message_id: null,
      },
    }
  )

  // transfert des données de recruitment_intentions_mail vers applications
  const intentionEmails = await getDbCollection("recruiter_intention_mails").find().toArray()
  intentionEmails.forEach(async (intentionEmail) => {
    await getDbCollection("applications").updateOne(
      { _id: intentionEmail.applicationId },
      {
        $set: {
          company_recruitment_intention: intentionEmail.intention,
          company_recruitment_intention_date: intentionEmail.createdAt,
          company_feedback_send_status: CompanyFeebackSendStatus.SCHEDULED,
        },
      }
    )
  })

  // nettoyage collection recruitment_intentions_mail
  await getDbCollection("recruiter_intention_mails").deleteMany({})
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = true
