import dayjs from "dayjs"
import { Filter, ObjectId } from "mongodb"
import { IAppointment, IEligibleTrainingsForAppointment, IEtablissement, IUser } from "shared"
import { mailType } from "shared/constants/appointment"
import { ReferrerObject } from "shared/constants/referers"

import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import config from "@/config"

import { getDbCollection } from "../common/utils/mongodbUtils"
import { sanitizeTextField } from "../common/utils/stringUtils"

import { createRdvaAppointmentIdPageLink } from "./appLinks.service"
import mailer from "./mailer.service"
import { getReferrerByKeyName } from "./referrers.service"
import { getLBALink } from "./trainingLinks.service"

const createAppointment = async (params: Omit<IAppointment, "_id" | "created_at">) => {
  const appointment: IAppointment = { ...params, _id: new ObjectId(), created_at: new Date() }
  await getDbCollection("appointments").insertOne(appointment)
  return appointment
}

const findById = async (id: ObjectId | string): Promise<IAppointment | null> => getDbCollection("appointments").findOne({ _id: new ObjectId(id) })

const find = (conditions: Filter<IAppointment>) => getDbCollection("appointments").find(conditions)

const findOne = (conditions: Filter<IAppointment>) => getDbCollection("appointments").findOne(conditions)

const findOneAndUpdate = (conditions: Filter<IAppointment>, values) => getDbCollection("appointments").findOneAndUpdate(conditions, values, { returnDocument: "after" })

export { createAppointment, find, findById, findOne, findOneAndUpdate }

const getMailData = async (candidate: IUser, appointment: IAppointment, eligibleTrainingsForAppointment: IEligibleTrainingsForAppointment, referrerObj: ReferrerObject) => {
  const lbaLink = await getLBALink({
    id: "0",
    cle_ministere_educatif: appointment.cle_ministere_educatif,
    utm_data: { utm_source: "lba-brevo-transactionnel", utm_medium: "email", utm_campaign: "lba_candidat-rdva-accuse-envoi_promo-emplois" },
  })
  const mailData = {
    appointmentId: appointment._id,
    user: {
      firstname: sanitizeTextField(candidate.firstname),
      lastname: sanitizeTextField(candidate.lastname),
      phone: sanitizeTextField(candidate.phone),
      email: sanitizeTextField(candidate.email),
      applicant_message_to_cfa: sanitizeTextField(appointment.applicant_message_to_cfa),
    },
    etablissement: {
      name: eligibleTrainingsForAppointment.etablissement_formateur_raison_sociale,
      formateur_address: eligibleTrainingsForAppointment.lieu_formation_street,
      formateur_zip_code: eligibleTrainingsForAppointment.lieu_formation_zip_code,
      formateur_city: eligibleTrainingsForAppointment.lieu_formation_city,
      email: eligibleTrainingsForAppointment.lieu_formation_email,
    },
    formation: { intitule: eligibleTrainingsForAppointment.training_intitule_long, searchLink: lbaLink },
    appointment: {
      reasons: appointment.applicant_reasons,
      referrerLink: referrerObj.url,
      appointment_origin: sanitizeTextField(referrerObj.full_name),
      created_at: appointment.created_at,
    },
    images: {
      logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
      logoRf: `${config.publicUrl}/images/emails/logo_rf.png?raw=true`,
      logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.webp?raw=true`,
      peopleLaptop: `${config.publicUrl}/assets/people-laptop.webp?raw=true`,
      idee: `${config.publicUrl}/images/emails/icone_idee.png?raw=true`,
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
    data: await getMailData(candidate, appointment, eligibleTrainingsForAppointment, referrerObj),
  })
  await findOneAndUpdate(
    { _id: appointment._id },
    { $push: { to_applicant_mails: { campaign: mailType.CANDIDAT_APPOINTMENT, status: null, message_id: email.messageId, email_sent_at: dayjs().toDate() } } }
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

  const email = await mailer.sendEmail({
    to: appointment.cfa_recipient_email,
    subject: `${subjectPrefix ?? ""} ${referrerObj.full_name} - un candidat a un message pour vous`,
    template: getStaticFilePath("./templates/mail-cfa-demande-de-contact.mjml.ejs"),
    data: {
      ...(await getMailData(candidate, appointment, eligibleTrainingsForAppointment, referrerObj)),
      link: createRdvaAppointmentIdPageLink(appointment.cfa_recipient_email, etablissement.formateur_siret, etablissement._id.toString(), appointment._id.toString()),
    },
  })
  await findOneAndUpdate(
    { _id: appointment._id },
    { $push: { to_cfa_mails: { campaign: mailType.CANDIDAT_APPOINTMENT, status: null, message_id: email.messageId, email_sent_at: dayjs().toDate() } } }
  )
}

export const processAppointmentToApplicantWebhookEvent = async (payload) => {
  const { date, event } = payload
  const messageId = payload["message-id"]

  const eventDate = dayjs.utc(date).tz("Europe/Paris").toDate()

  // If mail sent from appointment (to the candidat)
  const appointmentCandidatFound = await findOne({ "to_applicant_mails.message_id": messageId })
  if (appointmentCandidatFound && appointmentCandidatFound.to_applicant_mails?.length) {
    // deuxième condition ci-dessus utile uniquement pour typescript car to_applicant_mails peut être null selon le typage
    const firstEmailEvent = appointmentCandidatFound.to_applicant_mails[0]

    await getDbCollection("appointments").updateOne(
      { _id: appointmentCandidatFound._id },
      { $push: { to_applicant_mails: { campaign: firstEmailEvent.campaign, status: event, message_id: firstEmailEvent.message_id, webhook_status_at: eventDate } } }
    )
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
    if (appointment.to_cfa_mails?.length) {
      const firstEmailEvent = appointment.to_cfa_mails[0]

      await getDbCollection("appointments").updateOne(
        { _id: appointment._id },
        { $push: { to_cfa_mails: { campaign: firstEmailEvent.campaign, status: event, message_id: firstEmailEvent.message_id, webhook_status_at: eventDate } } }
      )
    }

    return false
  }
  return true
}

export const isHardbounceEventFromAppointmentApplicant = async (payload) => {
  const messageId = payload["message-id"]

  if (messageId) {
    const appointment = await findOne({ "to_applicant_mails.message_id": messageId })
    if (appointment) {
      return true
    }
  }
  return false
}

export const sendCandidateAppointmentHardbounceEmail = async (appointment: IAppointment) => {
  const { cle_ministere_educatif, applicant_id } = appointment
  const training = await getDbCollection("eligible_trainings_for_appointments").findOne({ cle_ministere_educatif })

  if (!training) {
    sentryCaptureException(new Error("Elligible training not found while processing appointment hardbounce"), { extra: { cle_ministere_educatif, applicant_id } })
    return
  }

  const formation = await getDbCollection("formationcatalogues").findOne({ cle_ministere_educatif })
  if (!formation) {
    sentryCaptureException(new Error("Catalogue formation not found while processing appointment hardbounce"), { extra: { cle_ministere_educatif, applicant_id } })
    return
  }

  const user = await getDbCollection("users").findOne({ _id: applicant_id })
  if (!user) {
    sentryCaptureException(new Error("Applicant not found while processing appointment hardbounce"), { extra: { cle_ministere_educatif, applicant_id } })
    return
  }

  const appointmentWithHardbounce = await getDbCollection("appointments").findOne({ _id: appointment._id, "to_applicant_mails.campaign": mailType.CFA_HARDBOUNCE })
  if (appointmentWithHardbounce) {
    sentryCaptureException(new Error("Appointment already processed for hardbounce"), { extra: { cle_ministere_educatif, applicant_id } })
    return
  }

  const email = await mailer.sendEmail({
    to: user.email,
    subject: `Le centre de formation ${training?.etablissement_formateur_raison_sociale} n’a pas reçu votre demande`,
    template: getStaticFilePath("./templates/mail-cfa-notification-hardbounce-cfa.mjml.ejs"),
    data: { phone: formation.num_tel, ...(await getMailData(user, appointment, training, getReferrerByKeyName(appointment.appointment_origin))) },
  })

  await findOneAndUpdate(
    { _id: appointment._id },
    { $push: { to_applicant_mails: { campaign: mailType.CFA_HARDBOUNCE, status: null, message_id: email.messageId, email_sent_at: dayjs().toDate() } } }
  )
}

export const isHardbounceEventFromAppointmentCfa = async (payload) => {
  const messageId = payload["message-id"]

  if (messageId) {
    const appointment = await findOne({ "to_cfa_mails.message_id": messageId })

    if (appointment) {
      await sendCandidateAppointmentHardbounceEmail(appointment)
      return true
    }
  }
  return false
}
