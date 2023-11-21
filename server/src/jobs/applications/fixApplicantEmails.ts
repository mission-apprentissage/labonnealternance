import { db } from "@/common/mongodb"

const removeOrReplaceCharsInDB = async (collection: string, field: string, charsToReplace: string, replacementChar: string = "") => {
  await db.collection(collection).updateMany(
    {},
    {
      $set: {
        applicant_email: {
          $regexReplace: {
            input: `$${field}`,
            find: charsToReplace,
            replacement: replacementChar,
            options: "i",
          },
        },
      },
    }
  )
}

const emailCharsToReplace = [
  {
    charsToReplace: "[èéêë]",
    replacementChar: "e",
  },
  {
    charsToReplace: "[àáâãäå]",
    replacementChar: "a",
  },
  {
    charsToReplace: "[ç]",
    replacementChar: "c",
  },
  {
    charsToReplace: "[œòóôõö]",
    replacementChar: "o",
  },
  {
    charsToReplace: "[ùúûü]",
    replacementChar: "u",
  },
  {
    charsToReplace: "[ìíîï]",
    replacementChar: "i",
  },
  {
    charsToReplace: "[ýÿ]",
    replacementChar: "y",
  },
  {
    charsToReplace: "[’£]",
    replacementChar: "",
  },
]

export default async function fixApplicantEmails() {
  emailCharsToReplace.forEach(async (c) => await removeOrReplaceCharsInDB("applications", "applicant_email", c.charsToReplace, c.replacementChar))
}
