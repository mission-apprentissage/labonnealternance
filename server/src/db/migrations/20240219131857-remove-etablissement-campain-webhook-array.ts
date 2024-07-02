import { Db } from "mongodb"

export const up = async (db: Db) => {
  await db.collection("etablissements").updateMany(
    {},
    {
      $unset: { to_etablissement_emails: "", affelnet_perimetre: "" },
    },
    {
      bypassDocumentValidation: true,
    }
  )
}
