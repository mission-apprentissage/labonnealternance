import { logger } from "../../common/logger"
import { getDbCollection } from "../../common/utils/mongodbUtils"
import { notifyToSlack } from "../../common/utils/slackUtils"

const anonymizeAppointments = async () => {
  logger.info(`Début anonymisation`)

  const lastYear = new Date()
  lastYear.setFullYear(lastYear.getFullYear() - 1)

  await getDbCollection("appointments")
    .aggregate([
      {
        $match: { created_at: { $lte: lastYear } },
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

  const res = await getDbCollection("appointments").deleteMany({ created_at: { $lte: lastYear } })

  return res.deletedCount
}

export const anonymizeOldAppointments = async function () {
  try {
    logger.info(" -- Anonymisation des appointments de plus de un (1) an -- ")

    const anonymizedAppointmentCount = await anonymizeAppointments()

    logger.info(`Fin traitement ${anonymizedAppointmentCount}`)

    await notifyToSlack({
      subject: "ANONYMISATION APPOINTMENTS",
      message: `Anonymisation des appointments de plus de un an terminée. ${anonymizedAppointmentCount} appointment(s) anonymisée(s).`,
      error: false,
    })
  } catch (err: any) {
    await notifyToSlack({ subject: "ANONYMISATION APPOINTMENTS", message: `ECHEC anonymisation des appointments`, error: true })
    throw err
  }
}

export default anonymizeOldAppointments
