import { Db } from "mongodb"

export const up = async (db: Db) => {
  await db.collection("etablissements").updateMany(
    {},
    {
      $unset: { to_etablissement_emails: "" },
    },
    {
      // @ts-expect-error bypassDocumentValidation is not properly set in @types/mongodb
      bypassDocumentValidation: true,
    }
  )
}
