import { Filter } from "mongodb"
import { IAppointment } from "shared/models"
import anonymizedAppointmentsModel from "shared/models/anonymizedAppointments.model"

import { logger } from "../../common/logger"
import { getDbCollection } from "../../common/utils/mongodbUtils"
import { notifyToSlack } from "../../common/utils/slackUtils"

export const anonymizeAppointments = async (filter: Filter<IAppointment>) => {
  await getDbCollection("appointments")
    .aggregate([
      {
        $match: filter,
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
        $merge: anonymizedAppointmentsModel.collectionName,
      },
    ])
    .toArray()

  const res = await getDbCollection("appointments").deleteMany(filter)

  return res.deletedCount
}

export const anonymizeOldAppointments = async function () {
  logger.info("[START] Anonymisation des appointments de plus de deux (2) ans")
  try {
    const period = new Date()
    period.setFullYear(period.getFullYear() - 2)
    const anonymizedAppointmentCount = await anonymizeAppointments({ created_at: { $lte: period } })

    await notifyToSlack({
      subject: "ANONYMISATION APPOINTMENTS",
      message: `Anonymisation des appointments de plus de un an terminée. ${anonymizedAppointmentCount} appointment(s) anonymisée(s).`,
    })
  } catch (err: any) {
    await notifyToSlack({ subject: "ANONYMISATION APPOINTMENTS", message: `ECHEC anonymisation des appointments`, error: true })
    throw err
  }
  logger.info("[END] Anonymisation des appointments de plus de deux (2) ans")
}

export default anonymizeOldAppointments
