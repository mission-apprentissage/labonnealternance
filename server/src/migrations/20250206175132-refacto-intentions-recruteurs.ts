import { Db } from "mongodb"
import { CompanyFeebackSendStatus } from "shared/models/index"

import { asyncForEach } from "@/common/utils/asyncUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async (db: Db) => {
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
  const intentionEmails = await db.collection("recruiter_intention_mails").find().toArray()
  await asyncForEach(intentionEmails, (intentionEmail) =>
    getDbCollection("applications").updateOne(
      { _id: intentionEmail.applicationId },
      {
        $set: {
          company_recruitment_intention: intentionEmail.intention,
          company_recruitment_intention_date: intentionEmail.createdAt,
          company_feedback_send_status: CompanyFeebackSendStatus.SCHEDULED,
        },
      }
    )
  )

  // nettoyage collection recruitment_intentions_mail
  await db.collection("recruiter_intention_mails").drop()
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = true
