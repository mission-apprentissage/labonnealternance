import { mailTemplate } from "../../../assets/index.js"
import { mailType } from "../../../common/model/constants/appointments.js"
import { getReferrerByKeyName } from "../../../common/model/constants/referrers.js"
import { Appointment, Etablissement, User } from "../../../common/model/index.js"
import { asyncForEach } from "../../../common/utils/asyncUtils.js"
import config from "../../../config.js"
import * as appointmentService from "../../../services/appointment.service.js"
import dayjs from "../../../services/dayjs.service.js"
import * as eligibleTrainingsForAppointmentService from "../../../services/eligibleTrainingsForAppointment.service.js"
import mailer from "../../../services/mailer.service.js"
import { logger } from "../../../common/logger.js"
import { sentryCaptureException } from "../../../common/utils/sentryUtils.js"
import { notifyToSlack } from "../../../common/utils/slackUtils.js"

export const repriseEmailRdvs = async () => {
  logger.info(`Reprise des emails de rdv: récupération des rdvs...`)
  const appointments = await Appointment.find({ to_cfa_mails: { $size: 0 } })
  logger.info(`Reprise des emails de rdv: ${appointments.length} rdvs à envoyer`)
  const stats = { success: 0, failure: 0 }

  await asyncForEach(appointments, async (appointment) => {
    try {
      const user = await User.findOne({ _id: appointment.applicant_id })
      const referrerObj = getReferrerByKeyName(appointment.appointment_origin)
      const eligibleTrainingsForAppointment = await eligibleTrainingsForAppointmentService.findOne({
        cle_ministere_educatif: appointment.cle_ministere_educatif,
        referrers: { $in: [referrerObj.name] },
      })
      const etablissement = await Etablissement.findOne({
        formateur_siret: eligibleTrainingsForAppointment.etablissement_formateur_siret,
      })

      const mailData = {
        appointmentId: appointment._id,
        user: {
          firstname: user.firstname,
          lastname: user.lastname,
          phone: user.phone.match(/.{1,2}/g).join("."),
          email: user.email,
          applicant_message_to_cfa: appointment.applicant_message_to_cfa,
        },
        etablissement: {
          name: eligibleTrainingsForAppointment.etablissement_formateur_raison_sociale,
          formateur_address: eligibleTrainingsForAppointment.lieu_formation_street,
          formateur_zip_code: eligibleTrainingsForAppointment.lieu_formation_zip_code,
          formateur_city: eligibleTrainingsForAppointment.lieu_formation_city,
          email: eligibleTrainingsForAppointment.lieu_formation_email,
        },
        formation: {
          intitule: eligibleTrainingsForAppointment.training_intitule_long,
        },
        appointment: {
          reasons: appointment.applicant_reasons,
          referrerLink: referrerObj.url,
          appointment_origin: referrerObj.full_name,
          link: `${config.publicUrlEspacePro}/establishment/${etablissement._id}/appointments/${appointment._id}?utm_source=mail`,
        },
        images: {
          logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
          logoFooter: `${config.publicUrlEspacePro}/assets/logo-republique-francaise.png?raw=true`,
          peopleLaptop: `${config.publicUrlEspacePro}/assets/people-laptop.png?raw=true`,
        },
      }

      let emailCfaSubject = `[${referrerObj.full_name}] - Un candidat a un message pour vous`

      if (eligibleTrainingsForAppointment.lieu_formation_zip_code) {
        emailCfaSubject = `${emailCfaSubject} - [${eligibleTrainingsForAppointment.lieu_formation_zip_code.slice(0, 2)}]`
      }

      // Sends email to "candidate" and "formation"
      const [emailCandidat, emailCfa] = await Promise.all([
        mailer.sendEmail({
          to: user.email,
          subject: `Le centre de formation a bien reçu votre demande de contact !`,
          template: mailTemplate["mail-candidat-confirmation-rdv"],
          data: mailData,
        }),
        mailer.sendEmail({
          to: eligibleTrainingsForAppointment.lieu_formation_email,
          subject: emailCfaSubject,
          template: mailTemplate["mail-cfa-demande-de-contact"],
          data: mailData,
        }),
      ])

      // Save in database SIB message-id for tracking
      await Promise.all([
        await appointmentService.findOneAndUpdate(
          { _id: appointment._id },
          {
            $push: {
              to_applicant_mails: {
                campaign: mailType.CANDIDAT_APPOINTMENT,
                status: null,
                message_id: emailCandidat.messageId,
                email_sent_at: dayjs().toDate(),
              },
            },
          }
        ),
        await appointmentService.findOneAndUpdate(
          { _id: appointment._id },
          {
            $push: {
              to_cfa_mails: {
                campaign: mailType.CANDIDAT_APPOINTMENT,
                status: null,
                message_id: emailCfa.messageId,
                email_sent_at: dayjs().toDate(),
              },
            },
          }
        ),
      ])
    } catch (err) {
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
