import { Db } from "mongodb"

const removeField = (db) => db.collection("appointments").updateMany({}, { $unset: { is_anonymized: "" } })

const anonymizeAppointments = (db) =>
  db
    .collection("appointments")
    .aggregate([
      {
        $match: { is_anonymized: true },
      },
      {
        $project: {
          applicant_id: 1,
          cfa_intention_to_applicant: 1,
          cfa_message_to_applicant_date: 1,
          cfa_gestionnaire_siret: 1,
          cfa_formateur_siret: 1,
          cfa_read_appointment_details_date: 1,
          appointment_origin: 1,
          cle_ministere_educatif: 1,
          created_at: 1,
        },
      },
      {
        $merge: "anonymizedappointments",
      },
    ])
    .toArray()

export const up = async (db: Db) => {
  await anonymizeAppointments(db)
  await removeField(db)
}
