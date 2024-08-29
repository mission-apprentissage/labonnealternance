import { badRequest, internal, notFound } from "@hapi/boom"
import { ObjectId } from "mongodb"
import { EApplicantRole } from "shared/constants/rdva"
import { zRoutes } from "shared/index"

import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getDbCollection } from "@/common/utils/mongodbUtils"

import config from "../../config"
import { createRdvaShortRecapToken } from "../../services/appLinks.service"
import * as appointmentService from "../../services/appointment.service"
import { sendCandidateAppointmentEmail, sendFormateurAppointmentEmail } from "../../services/appointment.service"
import dayjs from "../../services/dayjs.service"
import * as eligibleTrainingsForAppointmentService from "../../services/eligibleTrainingsForAppointment.service"
import { findElligibleTrainingForAppointment, getParameterByCleMinistereEducatif } from "../../services/eligibleTrainingsForAppointment.service"
import mailer, { sanitizeForEmail } from "../../services/mailer.service"
import { getReferrerByKeyName } from "../../services/referrers.service"
import * as users from "../../services/user.service"
import { Server } from "../server"

export default (server: Server) => {
  server.post(
    "/appointment-request/context/create",
    {
      schema: zRoutes.post["/appointment-request/context/create"],
    },
    async (req, res) => {
      res.status(200).send(await findElligibleTrainingForAppointment(req))
    }
  )

  server.post(
    "/appointment-request/validate",
    {
      schema: zRoutes.post["/appointment-request/validate"],
    },
    async (req, res) => {
      const { firstname, lastname, phone, applicantMessageToCfa, applicantReasons, type, appointmentOrigin, cleMinistereEducatif } = req.body
      const email = req.body.email.toLowerCase()

      const referrerObj = getReferrerByKeyName(appointmentOrigin)

      const eligibleTrainingsForAppointment = await getDbCollection("eligible_trainings_for_appointments").findOne({
        cle_ministere_educatif: cleMinistereEducatif,
        referrers: { $in: [referrerObj.name] },
      })

      if (!eligibleTrainingsForAppointment) {
        throw badRequest("Formation introuvable.")
      }

      if (!eligibleTrainingsForAppointment.lieu_formation_email) {
        throw internal("Le lieu de formation n'a aucun email")
      }

      const { user, isNew } = await users.createOrUpdateUserByEmail(
        email,
        // Updates firstname and last name if the user already exists
        { firstname, lastname, phone, type, last_action_date: new Date() },
        { role: EApplicantRole.CANDIDAT }
      )

      if (!isNew) {
        const appointment = await appointmentService.findOne({
          applicant_id: user._id,
          cle_ministere_educatif: eligibleTrainingsForAppointment.cle_ministere_educatif,
          created_at: {
            $gte: dayjs().subtract(4, "days").toDate(),
          },
        })

        if (appointment) {
          throw badRequest(`Une demande de prise de RDV en date du ${dayjs(appointment.created_at).format("DD/MM/YYYY")} est actuellement en cours de traitement.`)
        }
      }

      if (!eligibleTrainingsForAppointment.lieu_formation_email) {
        throw internal("Le lieu de formation n'a aucun email")
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
          cfa_read_appointment_details_date: null,
        }),
        getDbCollection("etablissements").findOne({
          formateur_siret: eligibleTrainingsForAppointment.etablissement_formateur_siret,
        }),
      ])

      if (!etablissement) {
        throw new Error("Etablissement not found")
      }

      // doit être appelé en premier pour valider l'envoi de mail au formateur
      await sendFormateurAppointmentEmail(user, createdAppointement, eligibleTrainingsForAppointment, referrerObj, etablissement)
      await sendCandidateAppointmentEmail(user, createdAppointement, eligibleTrainingsForAppointment, referrerObj)

      res.status(200).send({
        userId: user._id,
        appointment: createdAppointement,
        token: createRdvaShortRecapToken(user.email, createdAppointement._id.toString()),
      })
    }
  )

  server.get(
    "/appointment-request/context/short-recap",
    {
      schema: zRoutes.get["/appointment-request/context/short-recap"],
      onRequest: server.auth(zRoutes.get["/appointment-request/context/short-recap"]),
    },
    async (req, res) => {
      const { appointmentId } = req.query

      const appointment = await getDbCollection("appointments").findOne({ _id: new ObjectId(appointmentId) }, { projection: { cle_ministere_educatif: 1, applicant_id: 1 } })

      if (!appointment) {
        throw notFound()
      }

      const [formation, user] = await Promise.all([
        eligibleTrainingsForAppointmentService.findOne(
          { cle_ministere_educatif: appointment.cle_ministere_educatif },
          {
            projection: { etablissement_formateur_raison_sociale: 1, lieu_formation_email: 1, _id: 0 },
          }
        ),
        getDbCollection("users").findOne(
          { _id: new ObjectId(appointment.applicant_id) },
          {
            projection: {
              lastname: 1,
              firstname: 1,
              phone: 1,
              email: 1,
              _id: 0,
            },
          }
        ),
      ])

      if (!formation) {
        throw internal("Etablissment not found")
      }

      if (!user) {
        throw internal("User not found")
      }

      res.status(200).send({
        user,
        formation,
      })
    }
  )

  server.get(
    "/appointment-request/context/recap",
    {
      schema: zRoutes.get["/appointment-request/context/recap"],
      onRequest: [server.auth(zRoutes.get["/appointment-request/context/recap"])],
    },
    async (req, res) => {
      const { appointmentId } = req.query

      const appointment = await getDbCollection("appointments").findOne(
        { _id: new ObjectId(appointmentId) },
        {
          projection: {
            cle_ministere_educatif: 1,
            applicant_id: 1,
            applicant_reasons: 1,
            applicant_message_to_cfa: 1,
            cfa_intention_to_applicant: 1,
            cfa_message_to_applicant: 1,
            cfa_message_to_applicant_date: 1,
            cfa_read_appointment_details_date: 1,
          },
        }
      )

      if (!appointment) {
        throw notFound()
      }

      if (!appointment.cfa_read_appointment_details_date) {
        await getDbCollection("appointments").findOneAndUpdate({ _id: new ObjectId(appointmentId) }, { $set: { cfa_read_appointment_details_date: new Date() } })
      }

      const [formation, user] = await Promise.all([
        eligibleTrainingsForAppointmentService.findOne(
          { cle_ministere_educatif: appointment.cle_ministere_educatif },
          {
            projection: {
              training_intitule_long: 1,
              etablissement_formateur_raison_sociale: 1,
              lieu_formation_street: 1,
              lieu_formation_zip_code: 1,
              lieu_formation_email: 1,
              lieu_formation_city: 1,
            },
          }
        ),
        getDbCollection("users").findOne(
          { _id: appointment.applicant_id },
          {
            projection: {
              type: 1,
              lastname: 1,
              firstname: 1,
              phone: 1,
              email: 1,
            },
          }
        ),
      ])

      if (!user) {
        throw internal("User not found")
      }

      res.status(200).send({
        appointment,
        user,
        formation,
      })
    }
  )

  server.post(
    "/appointment-request/reply",
    {
      schema: zRoutes.post["/appointment-request/reply"],
      onRequest: [server.auth(zRoutes.post["/appointment-request/reply"])],
    },
    async (req, res) => {
      const { appointment_id, cfa_intention_to_applicant, cfa_message_to_applicant } = req.body

      const appointment = await getDbCollection("appointments").findOne({ _id: appointment_id })

      if (!appointment) throw notFound()

      if (!appointment.applicant_id) {
        throw internal("Applicant id not found.")
      }

      const { cle_ministere_educatif } = appointment
      const [eligibleTrainingsForAppointment, user] = await Promise.all([
        getParameterByCleMinistereEducatif({
          cleMinistereEducatif: cle_ministere_educatif,
        }),
        getDbCollection("users").findOne({ _id: appointment.applicant_id }),
      ])

      if (!user) throw notFound()

      if (cfa_intention_to_applicant === "personalised_answer") {
        const formationCatalogue = cle_ministere_educatif ? await getDbCollection("formationcatalogues").findOne({ cle_ministere_educatif }) : undefined

        await mailer.sendEmail({
          to: user.email,
          subject: `La bonne alternance - Le centre de formation vous répond`,
          template: getStaticFilePath("./templates/mail-reponse-cfa.mjml.ejs"),
          data: {
            logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
            prenom: sanitizeForEmail(user.firstname),
            nom: sanitizeForEmail(user.lastname),
            message: sanitizeForEmail(cfa_message_to_applicant),
            nom_formation: eligibleTrainingsForAppointment?.training_intitule_long,
            nom_cfa: eligibleTrainingsForAppointment?.etablissement_formateur_raison_sociale,
            cfa_email: eligibleTrainingsForAppointment?.lieu_formation_email,
            cfa_phone: formationCatalogue?.num_tel,
          },
        })
      }
      const cfa_message_to_applicant_date = new Date()
      await getDbCollection("appointments").findOneAndUpdate(
        { _id: appointment_id },
        { $set: { cfa_intention_to_applicant, cfa_message_to_applicant, cfa_message_to_applicant_date } }
      )
      res.status(200).send({
        appointment_id: appointment_id.toString(),
        cfa_intention_to_applicant,
        cfa_message_to_applicant,
        cfa_message_to_applicant_date: cfa_message_to_applicant_date.toISOString(),
      })
    }
  )
}
