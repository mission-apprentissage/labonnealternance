import Boom from "boom"
import express from "express"
import Joi from "joi"
import _ from "lodash-es"
import { mailTemplate } from "../../assets/index.js"
import { mailType } from "../../common/model/constants/etablissement.js"
import { referrers } from "../../common/model/constants/referrers.js"
import { dayjs } from "../../common/utils/dayjs.js"
import config from "../../config.js"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"

const optOutUnsubscribeSchema = Joi.object({
  opt_out_question: Joi.string().optional(),
})

const patchEtablissementIdAppointmentIdReadAppointSchema = Joi.object({
  has_been_read: Joi.boolean().required(),
})

/**
 * @description Etablissement Router.
 */
export default ({ etablissements, mailer, eligibleTrainingsForAppointments, appointments }) => {
  const router = express.Router()

  /**
   * @description Returns etablissement from its id.
   */
  router.get(
    "/:id",
    tryCatch(async (req, res) => {
      const etablissement = await etablissements.findById(req.params.id)

      if (!etablissement) {
        return res.sendStatus(404)
      }

      return res.send(etablissement)
    })
  )

  /**
   * @description Accepts "Premium Affelnet".
   */
  router.post(
    "/:id/premium/affelnet/accept",
    tryCatch(async (req, res) => {
      const etablissement = await etablissements.findById(req.params.id)

      if (!etablissement) {
        throw Boom.badRequest("Etablissement not found.")
      }

      if (etablissement.premium_affelnet_activation_date) {
        throw Boom.badRequest("Premium already activated.")
      }

      const mailAffelnet = await mailer.sendEmail({
        to: etablissement.gestionnaire_email,
        subject: `Activation du service “RDV Apprentissage” sur Choisir son affectation après la 3e`,
        template: mailTemplate["mail-cfa-premium-start"],
        data: {
          isAffelnet: true,
          images: {
            logoCandidat: `${config.publicUrlEspacePro}/assets/logo-lba.png?raw=true`,
            logoCfa: `${config.publicUrlEspacePro}/assets/logo-lba-recruteur-cfa.png?raw=true`,
            logoFooter: `${config.publicUrlEspacePro}/assets/logo-republique-francaise.png?raw=true`,
          },
          etablissement: {
            name: etablissement.raison_sociale,
            formateur_address: etablissement.formateur_address,
            formateur_zip_code: etablissement.formateur_zip_code,
            formateur_city: etablissement.formateur_city,
            formateur_siret: etablissement.formateur_siret,
            gestionnaire_email: etablissement.gestionnaire_email,
          },
          activationDate: dayjs().format("DD/MM"),
        },
      })

      const [eligibleTrainingsForAppointmentsAffelnetFound, etablissementAffelnetUpdated] = await Promise.all([
        eligibleTrainingsForAppointments.find({
          etablissement_formateur_siret: etablissement.formateur_siret,
        }),
        etablissements.findOneAndUpdate(
          { _id: etablissement._id },
          {
            $push: {
              to_etablissement_emails: {
                campaign: mailType.PREMIUM_AFFELNET_STARTING,
                status: null,
                message_id: mailAffelnet.messageId,
                email_sent_at: dayjs().toDate(),
              },
            },
            premium_affelnet_activation_date: dayjs().toDate(),
          }
        ),
      ])

      // Gets all mails (formation email + formateur email), excepted "email_decisionnaire"
      let emailsAffelnet = eligibleTrainingsForAppointmentsAffelnetFound.map((eligibleTrainingsForAppointment) => eligibleTrainingsForAppointment.lieu_formation_email)
      if (etablissement?.gestionnaire_email) {
        emailsAffelnet.push(etablissement.gestionnaire_email)
      }

      emailsAffelnet = _(emailsAffelnet)
        .uniq()
        .omitBy(_.isNil)
        .omitBy((item) => item === etablissement.gestionnaire_email)
        .toArray()

      await Promise.all(
        emailsAffelnet.map((email) =>
          mailer.sendEmail({
            to: email,
            subject: `La prise de rendez-vous est activée pour votre CFA sur Choisir son affectation après la 3e`,
            template: mailTemplate["mail-cfa-premium-activated"],
            data: {
              isAffelnet: true,
              url: config.publicUrl,
              replyTo: `${config.publicEmail}?subject=Email%20CFA%20Premium%20invite%20-%20MAJ%20contact%20formation`,
              images: {
                logo: `${config.publicUrlEspacePro}/assets/logo-lba.png?raw=true`,
                logoFooter: `${config.publicUrlEspacePro}/assets/logo-republique-francaise.png?raw=true`,
                peopleLaptop: `${config.publicUrlEspacePro}/assets/people-laptop.png?raw=true`,
              },
              etablissement: {
                name: etablissement.raison_sociale,
                formateur_address: etablissement.formateur_address,
                formateur_zip_code: etablissement.formateur_zip_code,
                formateur_city: etablissement.formateur_city,
                siret: etablissement.formateur_siret,
                email: etablissement.gestionnaire_email,
                premiumActivatedDate: dayjs(etablissementAffelnetUpdated.premium_affelnet_activation_date).format("DD/MM"),
                emailGestionnaire: etablissement.gestionnaire_email,
              },
              user: {
                destinataireEmail: email,
              },
            },
          })
        )
      )

      const [resultAffelnet] = await Promise.all([
        etablissements.findById(req.params.id),
        ...eligibleTrainingsForAppointmentsAffelnetFound.map((eligibleTrainingsForAppointment) =>
          eligibleTrainingsForAppointments.update(
            { _id: eligibleTrainingsForAppointment._id, lieu_formation_email: { $nin: [null, ""] } },
            {
              referrers: [...new Set([...eligibleTrainingsForAppointment.referrers, referrers.AFFELNET.name])],
            }
          )
        ),
      ])

      return res.send(resultAffelnet)
    })
  )

  /**
   * @description Accepts "Premium Parcoursup".
   */
  router.post(
    "/:id/premium/accept",
    tryCatch(async (req, res) => {
      const etablissement = await etablissements.findById(req.params.id)

      if (!etablissement) {
        throw Boom.badRequest("Etablissement not found.")
      }

      if (etablissement.premium_activation_date) {
        throw Boom.badRequest("Premium Parcoursup already activated.")
      }

      const mailParcoursup = await mailer.sendEmail({
        to: etablissement.gestionnaire_email,
        subject: `Activation du service “RDV Apprentissage” sur Parcoursup`,
        template: mailTemplate["mail-cfa-premium-start"],
        data: {
          isParcoursup: true,
          images: {
            logoCandidat: `${config.publicUrlEspacePro}/assets/logo-lba.png?raw=true`,
            logoCfa: `${config.publicUrlEspacePro}/assets/logo-lba-recruteur-cfa.png?raw=true`,
            logoFooter: `${config.publicUrlEspacePro}/assets/logo-republique-francaise.png?raw=true`,
          },
          etablissement: {
            name: etablissement.raison_sociale,
            formateur_address: etablissement.formateur_address,
            formateur_zip_code: etablissement.formateur_zip_code,
            formateur_city: etablissement.formateur_city,
            formateur_siret: etablissement.formateur_siret,
            gestionnaire_email: etablissement.gestionnaire_email,
          },
          activationDate: dayjs().format("DD/MM"),
        },
      })

      const [eligibleTrainingsForAppointmentsParcoursupFound, etablissementParcoursupUpdated] = await Promise.all([
        eligibleTrainingsForAppointments.find({
          etablissement_formateur_siret: etablissement.formateur_siret,
          parcoursup_id: {
            $ne: null,
          },
        }),
        etablissements.findOneAndUpdate(
          { _id: etablissement._id },
          {
            $push: {
              to_etablissement_emails: {
                campaign: mailType.PREMIUM_STARTING,
                status: null,
                message_id: mailParcoursup.messageId,
                email_sent_at: dayjs().toDate(),
              },
            },
            premium_activation_date: dayjs().toDate(),
          }
        ),
      ])

      // Gets all mails (formation email + formateur email), excepted "email_decisionnaire"
      let emailsParcoursup = eligibleTrainingsForAppointmentsParcoursupFound.map((eligibleTrainingsForAppointment) => eligibleTrainingsForAppointment.lieu_formation_email)
      if (etablissement?.gestionnaire_email) {
        emailsParcoursup.push(etablissement.gestionnaire_email)
      }

      emailsParcoursup = _(emailsParcoursup)
        .uniq()
        .omitBy(_.isNil)
        .omitBy((item) => item === etablissement.gestionnaire_email)
        .toArray()

      await Promise.all(
        emailsParcoursup.map((email) =>
          mailer.sendEmail({
            to: email,
            subject: `La prise de rendez-vous est activée pour votre CFA sur Parcoursup`,
            template: mailTemplate["mail-cfa-premium-activated"],
            data: {
              isParcoursup: true,
              url: config.publicUrl,
              replyTo: `${config.publicEmail}?subject=Email%20CFA%20Premium%20invite%20-%20MAJ%20contact%20formation`,
              images: {
                logo: `${config.publicUrlEspacePro}/assets/logo-lba.png?raw=true`,
                logoFooter: `${config.publicUrlEspacePro}/assets/logo-republique-francaise.png?raw=true`,
                peopleLaptop: `${config.publicUrlEspacePro}/assets/people-laptop.png?raw=true`,
              },
              etablissement: {
                name: etablissement.raison_sociale,
                formateur_address: etablissement.formateur_address,
                formateur_zip_code: etablissement.formateur_zip_code,
                formateur_city: etablissement.formateur_city,
                siret: etablissement.formateur_siret,
                email: etablissement.gestionnaire_email,
                premiumActivatedDate: dayjs(etablissementParcoursupUpdated.premium_activation_date).format("DD/MM"),
                emailGestionnaire: etablissement.gestionnaire_email,
              },
              user: {
                destinataireEmail: email,
              },
            },
          })
        )
      )

      const [result] = await Promise.all([
        etablissements.findById(req.params.id),
        ...eligibleTrainingsForAppointmentsParcoursupFound.map((eligibleTrainingsForAppointment) =>
          eligibleTrainingsForAppointments.update(
            { _id: eligibleTrainingsForAppointment._id, lieu_formation_email: { $nin: [null, ""] } },
            {
              referrers: [...new Set([...eligibleTrainingsForAppointment.referrers, referrers.PARCOURSUP.name])],
            }
          )
        ),
      ])

      return res.send(result)
    })
  )

  /**
   * @description Refuses "Premium Affelnet"
   */
  router.post(
    "/:id/premium/affelnet/refuse",
    tryCatch(async (req, res) => {
      const etablissement = await etablissements.findById(req.params.id)

      if (!etablissement) {
        throw Boom.badRequest("Etablissement not found.")
      }

      if (etablissement.premium_affelnet_refusal_date) {
        throw Boom.badRequest("Premium Affelnet already refused.")
      }

      if (etablissement.premium_affelnet_activation_date) {
        throw Boom.badRequest("Premium Affelnet already activated.")
      }

      const mailAffelnet = await mailer.sendEmail({
        to: etablissement.gestionnaire_email,
        subject: `Le service “RDV Apprentissage” ne sera pas activé sur Choisir son affectation après la 3e`,
        template: mailTemplate["mail-cfa-premium-refused"],
        data: {
          isAffelnet: true,
          images: {
            informationIcon: `${config.publicUrlEspacePro}/assets/icon-information-blue.png?raw=true`,
            logoCandidat: `${config.publicUrlEspacePro}/assets/logo-lba-recruteur-candidat.png?raw=true`,
            logoCfa: `${config.publicUrlEspacePro}/assets/logo-lba-recruteur-cfa.png?raw=true`,
            logoFooter: `${config.publicUrlEspacePro}/assets/logo-republique-francaise.png?raw=true`,
          },
          etablissement: {
            raison_sociale: etablissement.raison_sociale,
            formateur_address: etablissement.formateur_address,
            formateur_zip_code: etablissement.formateur_zip_code,
            formateur_city: etablissement.formateur_city,
            formateur_siret: etablissement.formateur_siret,
            email: etablissement.gestionnaire_email,
          },
          activationDate: dayjs().format("DD/MM"),
        },
      })

      await etablissements.findOneAndUpdate(
        { _id: etablissement._id },
        {
          $push: {
            to_etablissement_emails: {
              campaign: mailType.PREMIUM_AFFELNET_REFUSED,
              status: null,
              message_id: mailAffelnet.messageId,
              email_sent_at: dayjs().toDate(),
            },
          },
          premium_affelnet_refusal_date: dayjs().toDate(),
        }
      )

      const etablissementAffelnetUpdated = await etablissements.findById(req.params.id)

      return res.send(etablissementAffelnetUpdated)
    })
  )

  /**
   * @description Refuses "Premium Parcoursup"
   */
  router.post(
    "/:id/premium/refuse",
    tryCatch(async (req, res) => {
      const etablissement = await etablissements.findById(req.params.id)

      if (!etablissement) {
        throw Boom.badRequest("Etablissement not found.")
      }

      if (etablissement.premium_refusal_date) {
        throw Boom.badRequest("Premium Parcoursup already refused.")
      }

      if (etablissement.premium_activation_date) {
        throw Boom.badRequest("Premium Parcoursup already activated.")
      }

      const mailParcoursup = await mailer.sendEmail({
        to: etablissement.gestionnaire_email,
        subject: `Le service “RDV Apprentissage” ne sera pas activé sur Parcoursup`,
        template: mailTemplate["mail-cfa-premium-refused"],
        data: {
          isParcoursup: true,
          images: {
            informationIcon: `${config.publicUrlEspacePro}/assets/icon-information-blue.png?raw=true`,
            logoCandidat: `${config.publicUrlEspacePro}/assets/logo-lba-recruteur-candidat.png?raw=true`,
            logoCfa: `${config.publicUrlEspacePro}/assets/logo-lba-recruteur-cfa.png?raw=true`,
            logoFooter: `${config.publicUrlEspacePro}/assets/logo-republique-francaise.png?raw=true`,
          },
          etablissement: {
            raison_sociale: etablissement.raison_sociale,
            formateur_address: etablissement.formateur_address,
            formateur_zip_code: etablissement.formateur_zip_code,
            formateur_city: etablissement.formateur_city,
            formateur_siret: etablissement.formateur_siret,
            email: etablissement.gestionnaire_email,
          },
          activationDate: dayjs().format("DD/MM"),
        },
      })

      await etablissements.findOneAndUpdate(
        { _id: etablissement._id },
        {
          $push: {
            to_etablissement_emails: {
              campaign: mailType.PREMIUM_REFUSED,
              status: null,
              message_id: mailParcoursup.messageId,
              email_sent_at: dayjs().toDate(),
            },
          },
          premium_refusal_date: dayjs().toDate(),
        }
      )

      const etablissementParcoursupUpdated = await etablissements.findById(req.params.id)

      return res.send(etablissementParcoursupUpdated)
    })
  )

  /**
   * Patch etablissement appointment.
   */
  router.patch(
    "/:id/appointments/:appointmentId",
    tryCatch(async ({ body, params }, res) => {
      const { has_been_read } = await patchEtablissementIdAppointmentIdReadAppointSchema.validateAsync(body, {
        abortEarly: false,
      })

      const { id, appointmentId } = params

      let [etablissement, appointment] = await Promise.all([etablissements.findById(id), appointments.findById(appointmentId)])

      if (!etablissement) {
        throw Boom.badRequest("Etablissement not found.")
      }

      if (!appointment || appointment.cfa_formateur_siret !== etablissement.formateur_siret) {
        throw Boom.badRequest("Appointment not found.")
      }

      // Save current date
      if (!appointment.cfa_read_appointment_details_date && has_been_read) {
        await appointment.update({ cfa_read_appointment_details_date: dayjs().toDate() })
      }

      appointment = await appointments.findById(appointmentId)

      res.send(appointment)
    })
  )

  /**
   * @description OptOutUnsubscribe to "opt-out".
   */
  router.post(
    "/:id/opt-out/unsubscribe",
    tryCatch(async (req, res) => {
      const { opt_out_question } = await optOutUnsubscribeSchema.validateAsync(req.body, { abortEarly: false })

      let etablissement = await etablissements.findById(req.params.id)

      if (!etablissement) {
        return res.sendStatus(404)
      }

      if (etablissement.optout_refusal_date) {
        return res.sendStatus(400)
      }

      if (opt_out_question) {
        etablissement = await etablissements.findById(req.params.id)

        await mailer.sendEmail({
          to: config.publicEmail,
          subject: `Un CFA se pose une question concernant l'opt-out"`,
          template: mailTemplate["mail-rdva-optout-unsubscription-question"],
          data: {
            images: {
              logoCfa: `${config.publicUrlEspacePro}/assets/logo-lba-recruteur-cfa.png?raw=true`,
              logoFooter: `${config.publicUrlEspacePro}/assets/logo-republique-francaise.png?raw=true`,
            },
            etablissement: {
              name: etablissement.raison_sociale,
              formateur_address: etablissement.formateur_address,
              formateur_zip_code: etablissement.formateur_zip_code,
              formateur_city: etablissement.formateur_city,
              opt_out_question,
            },
            user: {
              destinataireEmail: etablissement.gestionnaire_email,
            },
          },
          from: config.transactionalEmail,
        })

        return res.send(etablissement)
      }

      // If opt-out is already running but user unsubscribe, disable all formations
      if (etablissement.optout_activation_date && dayjs(etablissement.optout_activation_date).isBefore(dayjs())) {
        // Disable all formations
        await eligibleTrainingsForAppointments.updateMany(
          {
            etablissement_formateur_siret: etablissement.formateur_siret,
          },
          {
            referrers: [],
          }
        )
      }

      await etablissements.findByIdAndUpdate(req.params.id, {
        optout_refusal_date: dayjs().toDate(),
      })

      const { messageId } = await mailer.sendEmail({
        to: etablissement.gestionnaire_email,
        subject: `Désincription au service “RDV Apprentissage”`,
        template: mailTemplate["mail-cfa-optout-unsubscription"],
        data: {
          images: {
            logoCfa: `${config.publicUrlEspacePro}/assets/logo-lba-recruteur-cfa.png?raw=true`,
            logoFooter: `${config.publicUrlEspacePro}/assets/logo-republique-francaise.png?raw=true`,
          },
          etablissement: {
            name: etablissement.raison_sociale,
            formateur_address: etablissement.formateur_address,
            formateur_zip_code: etablissement.formateur_zip_code,
            formateur_city: etablissement.formateur_city,
            siret: etablissement.formateur_siret,
          },
          user: {
            destinataireEmail: etablissement.gestionnaire_email,
          },
        },
      })

      await etablissements.findOneAndUpdate(
        { _id: etablissement._id },
        {
          $push: {
            to_etablissement_emails: {
              campaign: mailType.OPT_OUT_UNSUBSCRIPTION_CONFIRMATION,
              status: null,
              message_id: messageId,
              email_sent_at: dayjs().toDate(),
            },
          },
        }
      )

      etablissement = await etablissements.findById(req.params.id)

      return res.send(etablissement)
    })
  )

  return router
}
