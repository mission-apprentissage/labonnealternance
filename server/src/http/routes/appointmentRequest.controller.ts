import Boom from "boom"
import Joi from "joi"
import { zRoutes } from "shared/index"

import { getStaticFilePath } from "@/common/utils/getStaticFilePath"

import { mailType } from "../../common/model/constants/appointments"
import { getReferrerByKeyName } from "../../common/model/constants/referrers"
import { Appointment, EligibleTrainingsForAppointment, Etablissement, User } from "../../common/model/index"
import config from "../../config"
import * as appointmentService from "../../services/appointment.service"
import { ROLES } from "../../services/constant.service"
import dayjs from "../../services/dayjs.service"
import * as eligibleTrainingsForAppointmentService from "../../services/eligibleTrainingsForAppointment.service"
import mailer from "../../services/mailer.service"
import * as users from "../../services/user.service"
import { Server } from "../server"

const appointmentReplySchema = Joi.object({
  appointment_id: Joi.string().required(),
  cfa_intention_to_applicant: Joi.string().required(),
  cfa_message_to_applicant_date: Joi.date().required(),
  cfa_message_to_applicant: Joi.string().allow("").optional(),
})

export default (server: Server) => {
  server.post(
    "/appointment-request/validate",
    {
      schema: zRoutes.post["/appointment-request/validate"],
    },
    async (req, res) => {
      const { firstname, lastname, phone, applicantMessageToCfa, applicantReasons, type, appointmentOrigin, cleMinistereEducatif } = req.body
      const email = req.body.email.toLowerCase()

      const referrerObj = getReferrerByKeyName(appointmentOrigin)

      const eligibleTrainingsForAppointment = await eligibleTrainingsForAppointmentService.findOne({
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

        if (!user) {
          return
        }

        const appointment = await appointmentService.findOne({
          applicant_id: user._id,
          cle_ministere_educatif: eligibleTrainingsForAppointment.cle_ministere_educatif,
          created_at: {
            $gte: dayjs().subtract(4, "days").toDate(),
          },
        })

        if (appointment) {
          throw Boom.badRequest(`Une demande de prise de RDV en date du ${dayjs(appointment.created_at).format("DD/MM/YYYY")} est actuellement est cours de traitement.`)
        }
      } else {
        user = await users.createUser(email, {
          firstname,
          lastname,
          phone,
          email,
          type,
          role: ROLES.candidat,
          last_action_date: dayjs().toDate(),
        })
      }
      if (!eligibleTrainingsForAppointment.lieu_formation_email) {
        throw Boom.internal("Le lieu de formation n'a aucun email")
      }

      const [createdAppointement, etablissement] = await Promise.all([
        appointmentService.createAppointment({
          applicant_id: user._id,
          cfa_recipient_email: eligibleTrainingsForAppointment.lieu_formation_email,
          cfa_formateur_siret: eligibleTrainingsForAppointment.etablissement_formateur_siret,
          applicant_message_to_cfa: applicantMessageToCfa,
          applicant_reasons: applicantReasons,
          appointment_origin: referrerObj.name,
          cle_ministere_educatif: eligibleTrainingsForAppointment.cle_ministere_educatif,
        }),
        Etablissement.findOne({
          formateur_siret: eligibleTrainingsForAppointment.etablissement_formateur_siret,
        }),
      ])

      const mailData = {
        appointmentId: createdAppointement._id,
        user: {
          firstname: user.firstname,
          lastname: user.lastname,
          phone: user.phone,
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
          link: `${config.publicUrl}/espace-pro/establishment/${etablissement?._id}/appointments/${createdAppointement._id}?utm_source=mail`,
        },
        images: {
          logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
          logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.png?raw=true`,
          peopleLaptop: `${config.publicUrl}/assets/people-laptop.png?raw=true`,
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
          subject: `Votre demande de RDV auprès de ${eligibleTrainingsForAppointment.etablissement_formateur_raison_sociale}`,
          template: getStaticFilePath("./templates/mail-candidat-confirmation-rdv.mjml.ejs"),
          data: mailData,
        }),
        mailer.sendEmail({
          // TODO to check string | null
          to: eligibleTrainingsForAppointment.lieu_formation_email,
          subject: emailCfaSubject,
          template: getStaticFilePath("./templates/mail-cfa-demande-de-contact.mjml.ejs"),
          data: mailData,
        }),
      ])

      // Save in database SIB message-id for tracking
      await Promise.all([
        await appointmentService.findOneAndUpdate(
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
        await appointmentService.findOneAndUpdate(
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

      const appointmentUpdated = await Appointment.findById(createdAppointement._id)

      res.status(200).send({
        userId: user._id,
        appointment: appointmentUpdated,
      })
    }
  )

  server.get(
    "/appointment-request/context/recap",
    {
      schema: zRoutes.get["/appointment-request/context/recap"],
    },
    async (req, res) => {
      const { appointmentId } = req.query

      const appointment = await Appointment.findById(appointmentId, {
        cle_ministere_educatif: 1,
        applicant_id: 1,
        applicant_reasons: 1,
        applicant_message_to_cfa: 1,
        cfa_intention_to_applicant: 1,
        cfa_message_to_applicant: 1,
        cfa_message_to_applicant_date: 1,
      }).lean()

      if (!appointment) {
        throw Boom.notFound()
      }

      const [etablissement, user] = await Promise.all([
        EligibleTrainingsForAppointment.findOne(
          { cle_ministere_educatif: appointment.cle_ministere_educatif },
          {
            training_intitule_long: 1,
            etablissement_formateur_raison_sociale: 1,
            lieu_formation_street: 1,
            lieu_formation_zip_code: 1,
            lieu_formation_email: 1,
            lieu_formation_city: 1,
          }
        ).lean(),
        User.findById(appointment.applicant_id, {
          type: 1,
          lastname: 1,
          firstname: 1,
          phone: 1,
          email: 1,
        }).lean(),
      ])

      if (!etablissement) {
        throw Boom.internal("Etablissment not found")
      }

      if (!user) {
        throw Boom.internal("User not found")
      }

      res.status(200).send({
        appointment,
        user,
        etablissement,
      })
    }
  )

  server.post(
    "/appointment-request/reply",
    {
      schema: zRoutes.post["/appointment-request/reply"],
    },
    async (req, res) => {
      await appointmentReplySchema.validateAsync(req.body, { abortEarly: false })
      const { appointment_id, cfa_intention_to_applicant, cfa_message_to_applicant, cfa_message_to_applicant_date } = req.body

      const appointment = await Appointment.findById(appointment_id)

      if (!appointment) throw Boom.notFound()

      const [eligibleTrainingsForAppointment, user] = await Promise.all([
        eligibleTrainingsForAppointmentService.getParameterByCleMinistereEducatif({
          cleMinistereEducatif: appointment.cle_ministere_educatif,
        }),
        // TODO applicant_id null | undefined | string
        users.getUserById(appointment.applicant_id as string),
      ])

      if (!user || !eligibleTrainingsForAppointment) throw Boom.notFound()

      if (cfa_intention_to_applicant === "personalised_answer") {
        await mailer.sendEmail({
          to: user.email,
          subject: `[La bonne alternance] Le centre de formation vous répond`,
          template: getStaticFilePath("./templates/mail-reponse-cfa.mjml.ejs"),
          data: {
            logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
            prenom: user.firstname,
            nom: user.lastname,
            message: cfa_message_to_applicant,
            nom_formation: eligibleTrainingsForAppointment.training_intitule_long,
            nom_cfa: eligibleTrainingsForAppointment.etablissement_formateur_raison_sociale,
          },
        })
      }
      await appointmentService.updateAppointment(appointment_id, { cfa_intention_to_applicant, cfa_message_to_applicant, cfa_message_to_applicant_date })
      res.status(200).send({ appointment_id, cfa_intention_to_applicant, cfa_message_to_applicant, cfa_message_to_applicant_date })
    }
  )
}
