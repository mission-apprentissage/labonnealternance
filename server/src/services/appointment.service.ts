import dayjs from "dayjs"
import type { FilterQuery, ObjectId } from "mongoose"
import { IAppointment, IEligibleTrainingsForAppointment, IEtablissement, IUser } from "shared"

import { mailType } from "@/common/model/constants/appointments"
import { ReferrerObject } from "@/common/model/constants/referrers"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import config from "@/config"

import { Appointment } from "../common/model/index"

import { createRdvaAppointmentIdPageLink } from "./appLinks.service"
import mailer from "./mailer.service"

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
      firstname: candidate.firstname,
      lastname: candidate.lastname,
      phone: candidate.phone,
      email: candidate.email,
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

  let emailCfaSubject = `${subjectPrefix}[${referrerObj.full_name}] - Un candidat a un message pour vous`

  if (eligibleTrainingsForAppointment.lieu_formation_zip_code) {
    emailCfaSubject = `${emailCfaSubject} - [${eligibleTrainingsForAppointment.lieu_formation_zip_code.slice(0, 2)}]`
  }
  const mailData = getMailData(candidate, appointment, eligibleTrainingsForAppointment, referrerObj)
  const toEmail = appointment.cfa_recipient_email

  const email = await mailer.sendEmail({
    to: toEmail,
    subject: emailCfaSubject,
    template: getStaticFilePath("./templates/mail-cfa-demande-de-contact.mjml.ejs"),
    data: {
      ...mailData,
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
