import Boom from "boom"
import { ObjectId } from "bson"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { logger } from "../../../common/logger"
import { getReferrerByKeyName } from "../../../common/model/constants/referrers"
import { Etablissement } from "../../../common/model/index"
import { asyncForEach } from "../../../common/utils/asyncUtils"
import { sentryCaptureException } from "../../../common/utils/sentryUtils"
import { notifyToSlack } from "../../../common/utils/slackUtils"
import { sendFormateurAppointmentEmail } from "../../../services/appointment.service"
import dayjs from "../../../services/dayjs.service"
import * as eligibleTrainingsForAppointmentService from "../../../services/eligibleTrainingsForAppointment.service"

export const repriseEmailRdvs = async ({ fromDateStr }: { fromDateStr: string }) => {
  const dateFormat = "DD-MM-YYYY"
  const dayjsDate = dayjs(fromDateStr, dateFormat)
  if (!dayjsDate.isValid()) {
    throw Boom.internal(`invalid date: ${fromDateStr}. Valid format is ${dateFormat}`)
  }
  const fromDate = dayjsDate.toDate()
  logger.info(`Reprise des emails de rdv: récupération des rdvs depuis le ${fromDate.toISOString()}...`)
  const appointments = await getDbCollection("appointments")
    .find({ created_at: { $gt: fromDate } })
    .toArray()
  logger.info(`Reprise des emails de rdv: ${appointments.length} rdvs à envoyer`)
  const stats = { success: 0, failure: 0 }

  await asyncForEach(appointments, async (appointment) => {
    try {
      const user = await getDbCollection("users").findOne({ _id: new ObjectId(appointment.applicant_id) })
      const referrerObj = getReferrerByKeyName(appointment.appointment_origin)
      const eligibleTrainingsForAppointment = await eligibleTrainingsForAppointmentService.findOne({
        cle_ministere_educatif: appointment.cle_ministere_educatif,
        referrers: { $in: [referrerObj.name] },
      })
      const etablissement = await Etablissement.findOne({
        formateur_siret: eligibleTrainingsForAppointment?.etablissement_formateur_siret,
      })

      if (!user || !eligibleTrainingsForAppointment || !etablissement) {
        logger.error(`user, eligibleTrainingsForAppointment ou etablissement manquant pour appointmentId=${appointment._id}`)
        stats.failure++
        return
      }

      const subjectPrefix = "[Erratum]"
      // doit être appelé en premier pour valider l'envoi de mail au formateur
      await sendFormateurAppointmentEmail(user, appointment, eligibleTrainingsForAppointment, referrerObj, etablissement, subjectPrefix)
      // await sendCandidateAppointmentEmail(user, appointment, eligibleTrainingsForAppointment, referrerObj, subjectPrefix)
      stats.success++
    } catch (err: any) {
      const errorMessage = (err && "message" in err && err.message) || err
      logger.error(err)
      logger.error(`Reprise des emails de rdv: rdv id=${appointment._id}, erreur: ${errorMessage}`)
      sentryCaptureException(err)
      stats.failure++
    }
  })
  await notifyToSlack({
    subject: "Reprise des emails de rdv",
    message: `${stats.success} rdvs repris avec succès. ${stats.failure} rdvs ont rencontré une erreur.`,
    error: stats.failure > 0,
  })
  return stats
}
