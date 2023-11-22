import { logger } from "@/common/logger"
import { db } from "@/common/mongodb"
import { asyncForEach } from "@/common/utils/asyncUtils"

const removeOrReplaceCharsInDB = async (collection: string, field: string, charsToReplace: string, replacementChar: string = "") => {
  logger.info(`remplacement de ${charsToReplace} par ${replacementChar} dans ${collection}.${field}`)

  const charsRegex = new RegExp(`[${charsToReplace}]`, "gi")
  const applicants = await db
    .collection(collection)
    .find({ applicant_email: { $regex: charsRegex } })
    .toArray()

  applicants.map(async (application) => {
    console.log(application.applicant_email)

    const correctedEmail = application.applicant_email.replace(charsRegex, "e")

    application.applicant_email = correctedEmail

    await db.collection(collection).save(application)
  })
}

const emailCharsToReplace = [
  {
    charsToReplace: "èéêë",
    replacementChar: "e",
  },
  {
    charsToReplace: "àáâãäå",
    replacementChar: "a",
  },
  {
    charsToReplace: "ç",
    replacementChar: "c",
  },
  {
    charsToReplace: "œòóôõö",
    replacementChar: "o",
  },
  {
    charsToReplace: "ùúûü",
    replacementChar: "u",
  },
  {
    charsToReplace: "ìíîï",
    replacementChar: "i",
  },
  {
    charsToReplace: "ýÿ",
    replacementChar: "y",
  },
  {
    charsToReplace: "’£'^!&=/*?}",
    replacementChar: "",
  },
]

export default async function fixApplications() {
  await asyncForEach(emailCharsToReplace, async (c) => await removeOrReplaceCharsInDB("applications", "applicant_email", c.charsToReplace, c.replacementChar))

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
