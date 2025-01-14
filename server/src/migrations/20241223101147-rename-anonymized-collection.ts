import { Db } from "mongodb"

export const up = async (db: Db) => {
  // migrate data from anonymizeduserrecruteurs to anonymizeduserswithaccounts
  const anonymizeduserrecruteurs = await db.collection("anonymizeduserrecruteurs").find({})
  for await (const usrrecruteur of anonymizeduserrecruteurs) {
    await db.collection("anonymizeduserswithaccounts").insertOne({ last_action_date: usrrecruteur.last_connection, origin: "user migration", status: usrrecruteur.status || null })
  }
  // migrate data from anonymizeduserwithaccounts to anonymizeduserswithaccounts
  const anonymizeduserwithaccounts = await db
    .collection("anonymizeduserwithaccounts")
    .find({}, { projection: { _id: 0 } })
    .toArray()
  await db.collection("anonymizeduserswithaccounts").insertMany(anonymizeduserwithaccounts)

  // rename anonymizeduserswithaccounts to anonymized_userswithaccounts
  await db.collection("anonymizeduserswithaccounts").rename("anonymized_userswithaccounts", { dropTarget: true })
  // rename anonymizedappointments to anonymized_appointments
  await db.collection("anonymizedappointments").rename("anonymized_appointments", { dropTarget: true })
  // rename anonymizedapplications to anonymized_applications
  await db.collection("anonymizedapplications").rename("anonymized_applications", { dropTarget: true })
  // rename anonymizedrecruiters to anonymized_recruiters
  await db.collection("anonymizedrecruiteurs").rename("anonymized_recruiters", { dropTarget: true })
}
