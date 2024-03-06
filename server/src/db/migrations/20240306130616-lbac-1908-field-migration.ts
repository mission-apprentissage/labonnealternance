import { Db } from "mongodb"

const updateAnonymizedApplications = (db) =>
  db.collection("anonymizedapplications").updateMany(
    {
      $or: [{ job_origin: "matcha" }, { job_origin: "lba" }, { job_origin: "lbb" }],
    },
    {
      $set: {
        job_origin: {
          $cond: {
            if: { $eq: ["$job_origin", "matcha"] },
            then: "offres_emploi_lba",
            else: {
              $cond: {
                if: { $in: ["$job_origin", ["lba", "lbb"]] },
                then: "recruteurs_lba",
                else: "$job_origin",
              },
            },
          },
        },
      },
    }
  )

const updateApplications = (db) =>
  db.collection("applications").updateMany(
    {
      $or: [{ job_origin: "matcha" }, { job_origin: "lba" }, { job_origin: "lbb" }],
    },
    {
      $set: {
        job_origin: {
          $cond: {
            if: { $eq: ["$job_origin", "matcha"] },
            then: "offres_emploi_lba",
            else: {
              $cond: {
                if: { $in: ["$job_origin", ["lba", "lbb"]] },
                then: "recruteurs_lba",
                else: "$job_origin",
              },
            },
          },
        },
      },
    }
  )

const updateBonneBoites = (db) => db.collection("bonnesboites").updateMany({}, { $unset: { algorithm_origin: "" } })

const updateEmailblacklists = (db) =>
  db.collection("emailblacklists").updateMany(
    {
      $or: [{ blacklisting_origin: "brevo_spam" }, { blacklisting_origin: "matcha" }, { blacklisting_origin: "lba" }],
    },
    {
      $set: {
        blacklisting_origin: {
          $cond: {
            if: { $eq: ["$blacklisting_origin", "brevo_spam"] },
            then: "brevo",
            else: {
              $cond: {
                if: { $eq: ["$blacklisting_origin", "matcha"] },
                then: "candidature_offre",
                else: {
                  $cond: {
                    if: { $eq: ["$blacklisting_origin", "lba"] },
                    then: "candidature_spontanee",
                    else: "$blacklisting_origin",
                  },
                },
              },
            },
          },
        },
      },
    }
  )

const updateRecruiters = (db) =>
  db.collection("emailblacklists").updateMany(
    {
      $or: [{ origin: "matcha" }, { origin: "lbb" }],
    },
    {
      $set: {
        origin: {
          $cond: {
            if: { $eq: ["$origin", "matcha"] },
            then: "lba",
            else: {
              $cond: {
                if: { $eq: ["$origin", "lba"] },
                then: "lba",
                else: "$origin",
              },
            },
          },
        },
      },
    }
  )

export const up = async (db: Db) => {
  await updateAnonymizedApplications(db)
  await updateApplications(db)
  await updateBonneBoites(db)
  await updateEmailblacklists(db)
  await updateRecruiters(db)
}
