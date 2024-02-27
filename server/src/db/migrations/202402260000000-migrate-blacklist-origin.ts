import { Db } from "mongodb"

export const up = async (db: Db) => {
  await db.collection("emailblacklists").updateMany({ blacklisting_origin: "lbb" }, { $set: { blacklisting_origin: "lba" } })
  await db.collection("emailblacklists").updateMany({ blacklisting_origin: "rdv-transactional" }, { $set: { blacklisting_origin: "prise_de_rdv" } })
  await db.collection("emailblacklists").updateMany({ blacklisting_origin: { $in: ["brevo", "sendinblue"] } }, { $set: { blacklisting_origin: "brevo_spam" } })
}
