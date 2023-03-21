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
  applicantMessageToCfa: Joi.string().allow(null, ""),
  cleMinistereEducatif: Joi.string().required(),
  appointmentOrigin: Joi.string().required(),
})

const appointmentIdFollowUpSchema = Joi.object({
  action: Joi.string().valid(candidatFollowUpType.CONFIRM, candidatFollowUpType.RESEND).required(),
})

export default ({ users, appointments, mailer, eligibleTrainingsForAppointments, etablissements }) => {
  const router = express.Router()

  router.post(
    "/validate",
    tryCatch(async (req, res) => {
      await userRequestSchema.validateAsync(req.body, { abortEarly: false })

      let { firstname, lastname, phone, email, applicantMessageToCfa, appointmentOrigin, cleMinistereEducatif } = req.body

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
        user = await users.update(user._id, { firstname, lastname, phone, last_action_date: dayjs().format() })
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
          role: roles.candidat,
          last_action_date: dayjs().format(),
        })
      }

      const [createdAppointement, etablissement] = await Promise.all([
        appointments.createAppointment({
          applicant_id: user._id,
          cfa_recipient_email: eligibleTrainingsForAppointment.lieu_formation_email,
          cfa_gestionnaire_siret: eligibleTrainingsForAppointment.etablissement_gestionnaire_siret,
          cfa_formateur_siret: eligibleTrainingsForAppointment.etablissement_formateur_siret,
          applicant_message_to_cfa: applicantMessageToCfa,
          appointment_origin: referrerObj.name,
          rco_formation_id: eligibleTrainingsForAppointment.rco_formation_id,
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
          address: eligibleTrainingsForAppointment.lieu_formation_street,
          postalCode: eligibleTrainingsForAppointment.etablissement_formateur_zip_code,
          ville: eligibleTrainingsForAppointment.city,
          email: eligibleTrainingsForAppointment.lieu_formation_email,
        },
        formation: {
          intitule: eligibleTrainingsForAppointment.training_intitule_long,
        },
        appointment: {
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

      const appointment = await appointments.findById(appointmentId)

      const [eligibleTrainingsForAppointment, user] = await Promise.all([
        eligibleTrainingsForAppointments.getParameterByCleMinistereEducatif({
          cleMinistereEducatif: appointment.cle_ministere_educatif,
        }),
        users.getUserById(appointment.candidat_id),
      ])

      console.log("=================================")
      console.log(JSON.stringify(appointment, null, 2))
      console.log(JSON.stringify(getReferrerByKeyName(appointment.referrer), null, 2))
      res.json({
        appointment: {
          ...appointment,
          appointment_origin_detailed: getReferrerByKeyName(appointment.referrer),
        },
        user,
        eligibleTrainingsForAppointment,
      })
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
          adresse: etablissement.address,
          zip_code: etablissement.zip_code,
          localite: etablissement.city,
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
        users.findOne({ _id: appointment.candidat_id }),
        eligibleTrainingsForAppointments.findOne({ rco_formation_id: appointment.rco_formation_id }),
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
              address: eligibleTrainingsForAppointment.lieu_formation_street,
              postalCode: eligibleTrainingsForAppointment.etablissement_formateur_zip_code,
              ville: eligibleTrainingsForAppointment.city,
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
