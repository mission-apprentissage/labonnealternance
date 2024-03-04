import dayjs from "dayjs"
import type { FilterQuery, ObjectId } from "mongoose"
import { IAppointment, IEligibleTrainingsForAppointment, IEtablissement, IUser } from "shared"

import { logger } from "@/common/logger"
import { mailType } from "@/common/model/constants/appointments"
import { ReferrerObject } from "@/common/model/constants/referrers"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import config from "@/config"

import { Appointment } from "../common/model/index"

import { addEmailToBlacklist } from "./application.service"
import { createRdvaAppointmentIdPageLink } from "./appLinks.service"
import { BrevoEventStatus } from "./brevo.service"
import * as eligibleTrainingsForAppointmentService from "./eligibleTrainingsForAppointment.service"
import mailer, { sanitizeForEmail } from "./mailer.service"

export type NewAppointment = Pick<
  IAppointment,
  "applicant_id" | "cfa_recipient_email" | "cfa_formateur_siret" | "applicant_message_to_cfa" | "applicant_reasons" | "appointment_origin" | "cle_ministere_educatif"
>

const createAppointment = async (params: NewAppointment) => {
  const appointment = new Appointment(params)
  await appointment.save()

  return appointment.toObject()
}

const findById = async (id: ObjectId | string): Promise<IAppointment | null> => Appointment.findById(id).lean()

const find = (conditions: FilterQuery<IAppointment>) => Appointment.find(conditions)

const findOne = (conditions: FilterQuery<IAppointment>) => Appointment.findOne(conditions)

const findOneAndUpdate = (conditions: FilterQuery<IAppointment>, values) => Appointment.findOneAndUpdate(conditions, values, { new: true })

const updateMany = (conditions: FilterQuery<IAppointment>, values) => Appointment.updateMany(conditions, values)

const updateAppointment = (id: string, values) => Appointment.findOneAndUpdate({ _id: id }, values, { new: true })

export { createAppointment, find, findById, findOne, findOneAndUpdate, updateAppointment, updateMany }

const getMailData = (candidate: IUser, appointment: IAppointment, eligibleTrainingsForAppointment: IEligibleTrainingsForAppointment, referrerObj: ReferrerObject) => {
  const mailData = {
    appointmentId: appointment._id,
    user: {
      firstname: sanitizeForEmail(candidate.firstname),
      lastname: sanitizeForEmail(candidate.lastname),
      phone: sanitizeForEmail(candidate.phone),
      email: sanitizeForEmail(candidate.email),
      applicant_message_to_cfa: sanitizeForEmail(appointment.applicant_message_to_cfa),
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
      appointment_origin: sanitizeForEmail(referrerObj.full_name),
    },
    images: {
      logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
      logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.png?raw=true`,
      peopleLaptop: `${config.publicUrl}/assets/people-laptop.png?raw=true`,
    },
  }
  return mailData
}

export const sendCandidateAppointmentEmail = async (
  candidate: IUser,
  appointment: IAppointment,
  eligibleTrainingsForAppointment: IEligibleTrainingsForAppointment,
  referrerObj: ReferrerObject,
  subjectPrefix?: string
) => {
  const email = await mailer.sendEmail({
    to: candidate.email,
    subject: `${subjectPrefix ?? ""}Votre demande de RDV auprès de ${eligibleTrainingsForAppointment.etablissement_formateur_raison_sociale}`,
    template: getStaticFilePath("./templates/mail-candidat-confirmation-rdv.mjml.ejs"),
    data: getMailData(candidate, appointment, eligibleTrainingsForAppointment, referrerObj),
  })
  await findOneAndUpdate(
    { _id: appointment._id },
    {
      $push: {
        to_applicant_mails: {
          campaign: mailType.CANDIDAT_APPOINTMENT,
          status: null,
          message_id: email.messageId,
          email_sent_at: dayjs().toDate(),
        },
      },
    }
  )
}

export const sendFormateurAppointmentEmail = async (
  candidate: IUser,
  appointment: IAppointment,
  eligibleTrainingsForAppointment: IEligibleTrainingsForAppointment,
  referrerObj: ReferrerObject,
  etablissement: IEtablissement,
  subjectPrefix?: string
) => {
  if (!etablissement.formateur_siret) {
    throw new Error("Etablissement formateur_siret not found")
  }

  let emailCfaSubject = `${subjectPrefix ?? ""} ${referrerObj.full_name} - un candidat a un message pour vous`

  if (eligibleTrainingsForAppointment.lieu_formation_zip_code) {
    emailCfaSubject = `${emailCfaSubject} - [${eligibleTrainingsForAppointment.lieu_formation_zip_code.slice(0, 2)}]`
  }
  const toEmail = appointment.cfa_recipient_email

  const email = await mailer.sendEmail({
    to: toEmail,
    subject: emailCfaSubject,
    template: getStaticFilePath("./templates/mail-cfa-demande-de-contact.mjml.ejs"),
    data: {
      ...getMailData(candidate, appointment, eligibleTrainingsForAppointment, referrerObj),
      link: createRdvaAppointmentIdPageLink(toEmail, etablissement.formateur_siret, etablissement._id.toString(), appointment._id.toString()),
    },
  })
  await findOneAndUpdate(
    { _id: appointment._id },
    {
      $push: {
        to_cfa_mails: {
          campaign: mailType.CANDIDAT_APPOINTMENT,
          status: null,
          message_id: email.messageId,
          email_sent_at: dayjs().toDate(),
        },
      },
    }
  )
}

export const processAppointmentToApplicantWebhookEvent = async (payload) => {
  const { date, event } = payload
  const messageId = payload["message-id"]

  const eventDate = dayjs.utc(date).tz("Europe/Paris").toDate()

  // If mail sent from appointment (to the candidat)
  const appointmentCandidatFound = await findOne({
    "to_applicant_mails.message_id": messageId,
  })
  if (appointmentCandidatFound && appointmentCandidatFound.to_applicant_mails?.length) {
    // deuxième condition ci-dessus utile uniquement pour typescript car to_applicant_mails peut être null selon le typage
    const firstEmailEvent = appointmentCandidatFound.to_applicant_mails[0]

    await appointmentCandidatFound.update({
      $push: {
        to_applicant_mails: {
          campaign: firstEmailEvent.campaign,
          status: event,
          message_id: firstEmailEvent.message_id,
          webhook_status_at: eventDate,
        },
      },
    })
    return false
  }
  return true
}

export const processAppointmentToCfaWebhookEvent = async (payload) => {
  const { date, event } = payload
  const messageId = payload["message-id"]
  const eventDate = dayjs.utc(date).tz("Europe/Paris").toDate()

  // If mail sent from appointment model
  const appointment = await findOne({ "to_cfa_mails.message_id": messageId })
  if (appointment) {
    const firstEmailEvent = appointment.to_cfa_mails[0]

    await appointment.update({
      $push: {
        to_etablissement_emails: {
          campaign: firstEmailEvent.campaign,
          status: event,
          message_id: firstEmailEvent.message_id,
          webhook_status_at: eventDate,
        },
      },
    })

    // Disable eligibleTrainingsForAppointments in case of hard_bounce
    if (event === BrevoEventStatus.HARD_BOUNCE) {
      const eligibleTrainingsForAppointmentsWithEmail = await eligibleTrainingsForAppointmentService.find({ cfa_recipient_email: appointment.cfa_recipient_email })

      await Promise.all(
        eligibleTrainingsForAppointmentsWithEmail.map(async (eligibleTrainingsForAppointment) => {
          await eligibleTrainingsForAppointment.update({ referrers: [] })

          logger.info('Widget parameters disabled for "hard_bounce" reason', {
            eligibleTrainingsForAppointmentId: eligibleTrainingsForAppointment._id,
            cfa_recipient_email: appointment.cfa_recipient_email,
          })
        })
      )
      await addEmailToBlacklist(appointment.cfa_recipient_email, "rdv-transactional")
    }

    return false
  }
  return true
}
