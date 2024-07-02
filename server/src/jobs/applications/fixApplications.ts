import { cleanEmail } from "shared/helpers/common"

import { logger } from "@/common/logger"

import { getDbCollection } from "../../common/utils/mongodbUtils"

const removeOrReplaceCharsInDB = async () => {
  logger.info("Nettoyage des adresses emails mal formées dans applications.applicant_email")

  const charsRegex = /[^a-zA-Z0-9@_.+-]/
  const applicantsCursor = await getDbCollection("applications")
    .find({ applicant_email: { $regex: charsRegex } })
    .toArray()

  for await (const application of applicantsCursor) {
    const applicant_email = cleanEmail(application.applicant_email)
    if (applicant_email !== application.applicant_email) {
      await getDbCollection("applications").updateOne({ _id: application._id }, { $set: { applicant_email } })
    }
  }
}

export default async function fixApplications() {
  await removeOrReplaceCharsInDB()

  await getDbCollection("applications").updateMany(
    { company_naf: null },
    { $set: { company_naf: "" } },
    {
      bypassDocumentValidation: true,
    }
  )

  await getDbCollection("applications").updateMany(
    { job_title: null },
    { $set: { job_title: "" } },
    {
      bypassDocumentValidation: true,
    }
  )
}
