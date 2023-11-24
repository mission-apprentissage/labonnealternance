import { cleanEmail } from "shared/helpers/common"

import { logger } from "@/common/logger"
import { db } from "@/common/mongodb"

const removeOrReplaceCharsInDB = async () => {
  logger.info("Nettoyage des adresses emails mal formées dans applications.applicant_email")

  const charsRegex = /[^a-zA-Z0-9@_.+-]/
  const applicantsCursor = await db.collection("applications").find({ applicant_email: { $regex: charsRegex } })

  for await (const application of applicantsCursor) {
    const applicant_email = cleanEmail(application.applicant_email)
    await db.collection("applications").updateOne({ _id: application._id }, { $set: { applicant_email } })
  }
}

export default async function fixApplications() {
  await removeOrReplaceCharsInDB()

  await db.collection("applications").updateMany(
    { company_naf: null },
    { $set: { company_naf: "" } },
    {
      // @ts-expect-error bypassDocumentValidation is not properly set in @types/mongodb
      bypassDocumentValidation: true,
    }
  )

  await db.collection("applications").updateMany(
    { job_title: null },
    { $set: { job_title: "" } },
    {
      // @ts-expect-error bypassDocumentValidation is not properly set in @types/mongodb
      bypassDocumentValidation: true,
    }
  )
}
