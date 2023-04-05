import { meanBy, round } from "lodash-es"
import { logger } from "../../common/logger.js"
import { dayjs } from "../../common/utils/dayjs.js"
import { referrers } from "../../common/model/constants/referrers.js"

/**
 * @description Generate stats.
 * @returns {Promise<void>}
 */
export const parcoursupEtablissementStat = async ({ etablissements, appointments, parcoursupEtablissementStats }) => {
  logger.info("Cron #parcoursupEtablissementStat started.")

  await parcoursupEtablissementStats.deleteAll()

  const [allAppointments, allEtablissements] = await Promise.all([appointments.find({ appointment_origin: referrers.PARCOURSUP.name }).lean(), etablissements.find().lean()])

  const stats = allEtablissements
    .filter((etablissement) => etablissement.premium_activation_date)
    .map((etablissement) => {
      const relatedAppointments = allAppointments.filter((appointment) => appointment.etablissement_id === etablissement.formateur_siret)

      const openedAppointments = relatedAppointments.filter((appointment) => appointment.cfa_read_appointment_details_date)
      const notopenedAppointments = relatedAppointments.filter((appointment) => !appointment.cfa_read_appointment_details_date)

      const openedAppointmentsDuration = openedAppointments.map((appointment) => ({
        openedDurationInMinute: dayjs(appointment.cfa_read_appointment_details_date).diff(dayjs(appointment.created_at), "minutes"),
        openedDurationInHour: dayjs(appointment.cfa_read_appointment_details_date).diff(dayjs(appointment.created_at), "hours"),
        openedDurationDay: dayjs(appointment.cfa_read_appointment_details_date).diff(dayjs(appointment.created_at), "days"),
      }))

      const totalAppointments = relatedAppointments.length
      const totalOpenedAppointments = openedAppointments.length

      return {
        formateur_siret: etablissement.formateur_siret,
        raison_sociale: etablissement.raison_sociale,
        premium_activation_date: etablissement.premium_activation_date,
        total_appointments: relatedAppointments.length,
        applicants_details_checked: openedAppointments.length,
        applicants_details_not_checked: notopenedAppointments.length,
        percentage_of_appointment_opened: round((totalOpenedAppointments * 100) / totalAppointments || 0, 2),
        average_time_to_check_applicant_details_in_minutes: round(meanBy(openedAppointmentsDuration, "openedDurationInMinute") || 0, 2),
        average_time_to_check_applicant_details_in_hours: round(meanBy(openedAppointmentsDuration, "openedDurationInHour") || 0, 2),
        average_time_to_check_applicant_details_in_days: round(meanBy(openedAppointmentsDuration, "openedDurationDay") || 0, 2),
      }
    })

  await parcoursupEtablissementStats.bulkInsert(stats)

  logger.info("Cron #parcoursupEtablissementStat ended.")
}
