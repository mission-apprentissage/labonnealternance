import { logger } from "../../../common/logger"
import { mailType } from "../../../common/model/constants/appointments"
import { getReferrerByKeyName } from "../../../common/model/constants/referrers"
import { Appointment, Etablissement, User } from "../../../common/model/index"
import { asyncForEach } from "../../../common/utils/asyncUtils"
import { getStaticFilePath } from "../../../common/utils/getStaticFilePath"
import { sentryCaptureException } from "../../../common/utils/sentryUtils"
import { notifyToSlack } from "../../../common/utils/slackUtils"
import config from "../../../config"
import * as appointmentService from "../../../services/appointment.service"
import dayjs from "../../../services/dayjs.service"
import * as eligibleTrainingsForAppointmentService from "../../../services/eligibleTrainingsForAppointment.service"
import mailer from "../../../services/mailer.service"

export const repriseEmailRdvs = async ({ fromDateStr }: { fromDateStr: string }) => {
  const fromDate = dayjs(fromDateStr, "DD-MM-YYYY")
  logger.info(`Reprise des emails de rdv: récupération des rdvs depuis le ${fromDate.toISOString()}...`)
  const appointments = await Appointment.find({ to_cfa_mails: { $size: 0 }, created_at: { $gt: fromDate } })
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
        formateur_siret: eligibleTrainingsForAppointment?.etablissement_formateur_siret,
      })

      const mailData = {
        appointmentId: appointment._id,
        user: {
          firstname: user?.firstname,
          lastname: user?.lastname,
          phone: user?.phone,
          email: user?.email,
          applicant_message_to_cfa: appointment.applicant_message_to_cfa,
        },
        etablissement: {
          name: eligibleTrainingsForAppointment?.etablissement_formateur_raison_sociale,
          formateur_address: eligibleTrainingsForAppointment?.lieu_formation_street,
          formateur_zip_code: eligibleTrainingsForAppointment?.lieu_formation_zip_code,
          formateur_city: eligibleTrainingsForAppointment?.lieu_formation_city,
          email: eligibleTrainingsForAppointment?.lieu_formation_email,
        },
        formation: {
          intitule: eligibleTrainingsForAppointment?.training_intitule_long,
        },
        appointment: {
          reasons: appointment.applicant_reasons,
          referrerLink: referrerObj.url,
          appointment_origin: referrerObj.full_name,
          link: `${config.publicUrl}/espace-pro/establishment/${etablissement?._id}/appointments/${appointment._id}?utm_source=mail`,
        },
        images: {
          logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
          logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.png?raw=true`,
          peopleLaptop: `${config.publicUrl}/assets/people-laptop.png?raw=true`,
        },
      }

      let emailCfaSubject = `[${referrerObj.full_name}] - Un candidat a un message pour vous`

      if (eligibleTrainingsForAppointment?.lieu_formation_zip_code) {
        emailCfaSubject = `${emailCfaSubject} - [${eligibleTrainingsForAppointment.lieu_formation_zip_code.slice(0, 2)}]`
      }

      if (!user || !eligibleTrainingsForAppointment) {
        return
      }

      // Sends email to "candidate" and "formation"
      const [emailCandidat, emailCfa] = await Promise.all([
        mailer.sendEmail({
          to: user.email,
          subject: `Le centre de formation a bien reçu votre demande de contact !`,
          template: getStaticFilePath("./templates/mail-candidat-confirmation-rdv.mjml.ejs"),
          data: mailData,
        }),
        mailer.sendEmail({
          // TODO string | null
          to: eligibleTrainingsForAppointment.lieu_formation_email as string,
          subject: emailCfaSubject,
          template: getStaticFilePath("./templates/mail-cfa-demande-de-contact.mjml.ejs"),
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
      stats.success++
      // TODO
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
