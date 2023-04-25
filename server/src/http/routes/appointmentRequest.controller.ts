import Boom from "boom"
import express from "express"
import Joi from "joi"
import { mailTemplate } from "../../assets/index.js"
import { candidatFollowUpType, mailType } from "../../common/model/constants/appointments.js"
import { getReferrerById, getReferrerByKeyName } from "../../common/model/constants/referrers.js"
import { roles } from "../../common/roles.js"
import { dayjs } from "../../common/utils/dayjs.js"
import config from "../../config.js"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"

const userRequestSchema = Joi.object({
  firstname: Joi.string().required(),
  lastname: Joi.string().required(),
  phone: Joi.string().required(),
  email: Joi.string().required(),
  type: Joi.string(),
  applicantMessageToCfa: Joi.string().allow(null, ""),
  applicantReasons: Joi.array().items(Joi.string().valid("modalite", "contenu", "porte", "frais", "place", "horaire", "plus", "accompagnement", "lieu", "suivi", "autre")),
  cleMinistereEducatif: Joi.string().required(),
  appointmentOrigin: Joi.string().required(),
})

const appointmentIdFollowUpSchema = Joi.object({
  action: Joi.string().valid(candidatFollowUpType.CONFIRM, candidatFollowUpType.RESEND).required(),
})

const appointmentReplySchema = Joi.object({
  appointment_id: Joi.string().required(),
  cfa_intention_to_applicant: Joi.string().required(),
  cfa_message_to_applicant_date: Joi.date().required(),
  cfa_message_to_applicant: Joi.string().allow("").optional(),
})

export default ({ users, appointments, mailer, eligibleTrainingsForAppointments, etablissements }) => {
  const router = express.Router()

  router.post(
    "/validate",
    tryCatch(async (req, res) => {
      await userRequestSchema.validateAsync(req.body, { abortEarly: false })

      let { firstname, lastname, phone, email, applicantMessageToCfa, applicantReasons, type, appointmentOrigin, cleMinistereEducatif } = req.body

      email = email.toLowerCase()

      const referrerObj = getReferrerByKeyName(appointmentOrigin)

      const eligibleTrainingsForAppointment = await eligibleTrainingsForAppointments.findOne({
        cle_ministere_educatif: cleMinistereEducatif,
        referrers: { $in: [referrerObj.name] },
      })

      if (!eligibleTrainingsForAppointment) {
        throw Boom.badRequest("Formation introuvable.")
      }

      let user = await users.getUser(email)

      // Updates firstname and last name if the user already exists
      if (user) {
        user = await users.update(user._id, { firstname, lastname, phone, type, last_action_date: dayjs().format() })
        const appointment = await appointments.findOne({
          applicant_id: user._id,
          cle_ministere_educatif: eligibleTrainingsForAppointment.cle_ministere_educatif,
          created_at: {
            $gte: dayjs().subtract(4, "days").toDate(),
          },
        })

        if (appointment) {
          return res.send({
            error: {
              message: `Une demande de prise de RDV en date du ${dayjs(appointment.createdAt).format("DD/MM/YYYY")} est actuellement est cours de traitement.`,
            },
          })
        }
      } else {
        user = await users.createUser(email, "NA", {
          firstname,
          lastname,
          phone,
          email,
          type,
          role: roles.candidat,
          last_action_date: dayjs().format(),
        })
      }

      const [createdAppointement, etablissement] = await Promise.all([
        appointments.createAppointment({
          applicant_id: user._id,
          cfa_recipient_email: eligibleTrainingsForAppointment.lieu_formation_email,
          cfa_formateur_siret: eligibleTrainingsForAppointment.etablissement_formateur_siret,
          applicant_message_to_cfa: applicantMessageToCfa,
          applicant_reasons: applicantReasons,
          appointment_origin: referrerObj.name,
          cle_ministere_educatif: eligibleTrainingsForAppointment.cle_ministere_educatif,
        }),
        etablissements.findOne({
          formateur_siret: eligibleTrainingsForAppointment.etablissement_formateur_siret,
        }),
      ])

      const mailData = {
        appointmentId: createdAppointement._id,
        user: {
          firstname: user.firstname,
          lastname: user.lastname,
          phone: user.phone.match(/.{1,2}/g).join("."),
          email: user.email,
          applicant_message_to_cfa: createdAppointement.applicant_message_to_cfa,
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
          reasons: createdAppointement.applicant_reasons,
          referrerLink: referrerObj.url,
          appointment_origin: referrerObj.full_name,
          link: `${config.publicUrlEspacePro}/establishment/${etablissement._id}/appointments/${createdAppointement._id}?utm_source=mail`,
        },
        images: {
          logoCandidat: `${config.publicUrlEspacePro}/assets/logo-lba-recruteur-candidat.png?raw=true`,
          logoCfa: `${config.publicUrlEspacePro}/assets/logo-lba-recruteur-cfa.png?raw=true`,
          logoFooter: `${config.publicUrlEspacePro}/assets/logo-republique-francaise.png?raw=true`,
          peopleLaptop: `${config.publicUrlEspacePro}/assets/people-laptop.png?raw=true`,
        },
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
          subject: `[RDV via ${referrerObj.full_name}] Un candidat souhaite être contacté`,
          template: mailTemplate["mail-cfa-demande-de-contact"],
          data: mailData,
        }),
      ])

      // Save in database SIB message-id for tracking
      await Promise.all([
        await appointments.findOneAndUpdate(
          { _id: createdAppointement._id },
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
        await appointments.findOneAndUpdate(
          { _id: createdAppointement._id },
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

      const appointmentUpdated = await appointments.findById(createdAppointement._id)

      res.json({
        userId: user._id,
        appointment: appointmentUpdated,
      })
    })
  )

  router.get(
    "/context/recap",
    tryCatch(async (req, res) => {
      const { appointmentId } = req.query

      const appointment = await appointments.findById(appointmentId).lean()

      const [eligibleTrainingsForAppointment, user] = await Promise.all([
        eligibleTrainingsForAppointments.getParameterByCleMinistereEducatif({
          cleMinistereEducatif: appointment.cle_ministere_educatif,
        }),
        users.getUserById(appointment.applicant_id),
      ])

      res.json({
        appointment: {
          ...appointment,
          appointment_origin_detailed: getReferrerByKeyName(appointment.appointment_origin),
        },
        user,
        etablissement: { ...eligibleTrainingsForAppointment },
      })
    })
  )

  router.post(
    "/reply",
    tryCatch(async (req, res) => {
      await appointmentReplySchema.validateAsync(req.body, { abortEarly: false })
      const { appointment_id, cfa_intention_to_applicant, cfa_message_to_applicant, cfa_message_to_applicant_date } = req.body

      const appointment = await appointments.findById(appointment_id).lean()

      const [eligibleTrainingsForAppointment, user] = await Promise.all([
        eligibleTrainingsForAppointments.getParameterByCleMinistereEducatif({
          cleMinistereEducatif: appointment.cle_ministere_educatif,
        }),
        users.getUserById(appointment.applicant_id),
      ])

      if (cfa_intention_to_applicant === "personalised_answer") {
        await mailer.sendEmail({
          to: user.email,
          subject: `[La bonne alternance] Le centre de formation vous répond`,
          template: mailTemplate["mail-reponse-cfa"],
          data: {
            logo: `${config.publicUrlEspacePro}/assets/logo-lba-cfa-candidat.png`,
            prenom: user.firstname,
            nom: user.lastname,
            message: cfa_message_to_applicant,
            nom_formation: eligibleTrainingsForAppointment.training_intitule_long,
            nom_cfa: eligibleTrainingsForAppointment.etablissement_formateur_raison_sociale,
          },
        })
      }
      await appointments.updateAppointment(appointment_id, { cfa_intention_to_applicant, cfa_message_to_applicant, cfa_message_to_applicant_date })
      res.json({ appointment_id, cfa_intention_to_applicant, cfa_message_to_applicant, cfa_message_to_applicant_date })
    })
  )

  router.get(
    "/:id/candidat/follow-up",
    tryCatch(async (req, res) => {
      const appointment = await appointments.findOne({ _id: req.params.id })

      if (!appointment) {
        return res.sendStatus(400)
      }

      const etablissement = await etablissements.findOne({ formateur_siret: appointment.etablissement_id })

      // Check if the RESEND action has already been triggered
      const cfaMailResendExists = appointment.to_cfa_mails.find((mail) => mail.campaign === mailType.CFA_REMINDER_RESEND_APPOINTMENT)

      res.send({
        formAlreadySubmit: !!(appointment.candidat_contacted_at || cfaMailResendExists),
        etablissement: {
          raison_sociale: etablissement.raison_sociale,
          formateur_address: etablissement.formateur_address,
          formateur_zip_code: etablissement.formateur_zip_code,
          formateur_city: etablissement.formateur_city,
        },
      })
    })
  )

  router.post(
    "/:id/candidat/follow-up",
    tryCatch(async (req, res) => {
      const { action } = await appointmentIdFollowUpSchema.validateAsync(req.body, { abortEarly: false })

      const appointment = await appointments.findOne({ _id: req.params.id })

      if (!appointment) {
        return res.sendStatus(400)
      }

      // Check if the RESEND action has already been triggered
      const cfaMailResendExists = appointment.to_cfa_mails.find((mail) => mail.campaign === mailType.CFA_REMINDER_RESEND_APPOINTMENT)

      if (appointment.candidat_contacted_at || cfaMailResendExists) {
        return res.sendStatus(400)
      }

      const [user, eligibleTrainingsForAppointment] = await Promise.all([
        users.findOne({ _id: appointment.applicant_id }),
        eligibleTrainingsForAppointments.findOne({ cle_ministere_educatif: appointment.cle_ministere_educatif }),
      ])

      if (action === candidatFollowUpType.RESEND) {
        const referrerObj = getReferrerById(appointment.referrer)

        const { messageId } = await mailer.sendEmail({
          to: eligibleTrainingsForAppointment.lieu_formation_email,
          subject: `[RDV via ${referrerObj.full_name}] Relance - Un candidat souhaite être contacté`,
          template: mailTemplate["mail-cfa-demande-de-contact"],
          data: {
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
            },
            formation: {
              intitule: eligibleTrainingsForAppointment.training_intitule_long,
            },
            appointment: {
              referrerLink: referrerObj.url,
              appointment_origin: referrerObj.full_name,
            },
            images: {
              peopleLaptop: `${config.publicUrlEspacePro}/assets/girl_laptop.png?raw=true`,
            },
          },
        })

        await appointments.findOneAndUpdate(
          { _id: appointment._id },
          {
            $push: {
              to_cfa_mails: {
                campaign: mailType.CFA_REMINDER_RESEND_APPOINTMENT,
                status: null,
                message_id: messageId,
                email_sent_at: dayjs().toDate(),
              },
            },
          }
        )
      }

      res.sendStatus(200)
    })
  )

  return router
}
