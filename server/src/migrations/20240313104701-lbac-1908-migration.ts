import { Db } from "mongodb"

const updateAnonymizedApplications = (db, collection) =>
  Promise.all([
    db.collection(collection).updateMany({ job_origin: "matcha" }, { $set: { job_origin: "offres_emploi_lba" } }),
    db.collection(collection).updateMany({ $or: [{ job_origin: "lba" }, { job_origin: "lbb" }] }, { $set: { job_origin: "recruteurs_lba" } }),
  ])

const updateBonneBoites = (db) => db.collection("bonnesboites").updateMany({}, { $unset: { algorithm_origin: "" } })

const updateEmailblacklists = (db) =>
  Promise.all([
    db.collection("emailblacklists").updateMany({ blacklisting_origin: "matcha" }, { $set: { blacklisting_origin: "candidature_offre" } }),
    db.collection("emailblacklists").updateMany({ blacklisting_origin: "lba" }, { $set: { blacklisting_origin: "candidature_spontanee" } }),
  ])

const updateRecruiters = (db) => db.collection("recruiters").updateMany({ $or: [{ origin: "matcha" }, { origin: "lbb" }] }, { $set: { origin: "lba" } })

export const up = async (db: Db) => {
  await updateAnonymizedApplications(db, "anonymizedapplications")
  await updateAnonymizedApplications(db, "applications")
  await updateBonneBoites(db)
  await updateEmailblacklists(db)
  await updateRecruiters(db)
}
