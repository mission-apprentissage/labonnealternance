import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sendCandidateAppointmentEmail, sendFormateurAppointmentEmail } from "@/services/appointment.service"
import { getReferrerByKeyName } from "@/services/referrers.service"

export const repriseEnvoiEmailsPRDV = async () => {
  const fromDate = new Date("2025-04-23T18:00:00.00Z")
  const toDate = new Date("2025-04-28T18:00:00.00Z")

  const appointments = await getDbCollection("appointments")
    .find({
      $and: [{ created_at: { $gte: fromDate } }, { created_at: { $lte: toDate } }, { to_cfa_mails: { $exists: false } }],
    })
    .toArray()

  let [found, successes, errors] = [0, 0, 0]
  await asyncForEach(appointments, async (appointment) => {
    found++
    try {
      const referrerObj = getReferrerByKeyName(appointment.appointment_origin)
      const [user, eligibleTrainingsForAppointment, etablissement] = await Promise.all([
        getDbCollection("users").findOne({ _id: appointment.applicant_id }),
        getDbCollection("eligible_trainings_for_appointments").findOne({
          cle_ministere_educatif: appointment.cle_ministere_educatif,
        }),
        getDbCollection("etablissements").findOne({
          formateur_siret: appointment.cfa_formateur_siret,
        }),
      ])

      if (user && eligibleTrainingsForAppointment && etablissement) {
        await sendFormateurAppointmentEmail(user, appointment, eligibleTrainingsForAppointment, referrerObj, etablissement)
        await sendCandidateAppointmentEmail(user, appointment, eligibleTrainingsForAppointment, referrerObj)
        successes++
      } else {
        throw new Error("elements introuvables")
      }
    } catch (err) {
      logger.error(err)
      errors++
    }
  })

  logger.info(`Reprises demande de rendez-vous terminées. à renvoyer : ${found}, succès : ${successes}, échecs: ${errors}`)
}
