import Boom from "boom"
import express from "express"
import { uniq } from "lodash-es"
import Joi from "joi"
import { mailType } from "../../common/model/constants/etablissement.js"
import { referrers } from "../../common/model/constants/referrers.js"
import { dayjs } from "../../common/utils/dayjs.js"
import config from "../../config.js"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"
import { mailTemplate } from "../../assets/index.js"

const optOutUnsubscribeSchema = Joi.object({
  opt_out_question: Joi.string().optional(),
})

const patchEtablissementIdAppointmentIdReadAppointSchema = Joi.object({
  has_been_read: Joi.boolean().required(),
})

/**
 * @description Etablissement Router.
 */
export default ({ etablissements, mailer, widgetParameters, appointments }) => {
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
   * @description Confirm that the etablissement wants to be published on Parcoursup.
   */
  router.post(
    "/:id/premium/accept",
    tryCatch(async (req, res) => {
      const etablissement = await etablissements.findById(req.params.id)

      if (!etablissement) {
        throw Boom.badRequest("Etablissement not found.")
      }

      if (etablissement.premium_activated_at) {
        throw Boom.badRequest("Premium already activated.")
      }

      const { messageId } = await mailer.sendEmail({
        to: etablissement.email_decisionnaire,
        subject: `Activation du service “RDV Apprentissage” sur Parcoursup`,
        template: mailTemplate["mail-cfa-premium-start"],
        data: {
          images: {
            logoCandidat: `${config.publicUrlEspacePro}/assets/logo-lba-recruteur-candidat.png?raw=true`,
            logoCfa: `${config.publicUrlEspacePro}/assets/logo-lba-recruteur-cfa.png?raw=true`,
            logoFooter: `${config.publicUrlEspacePro}/assets/logo-republique-francaise.png?raw=true`,
          },
          etablissement: {
            name: etablissement.raison_sociale,
            address: etablissement.adresse,
            postalCode: etablissement.code_postal,
            ville: etablissement.localite,
            siret: etablissement.siret_formateur,
            email: etablissement.email_decisionnaire,
          },
          activationDate: dayjs().format("DD/MM"),
        },
        from: config.email,
      })

      const [widgetParametersFound] = await Promise.all([
        widgetParameters.find({ etablissement_siret: etablissement.siret_formateur }),
        etablissements.findOneAndUpdate(
          { _id: etablissement._id },
          {
            $push: {
              mailing: {
                campaign: mailType.PREMIUM_STARTING,
                status: null,
                message_id: messageId,
                email_sent_at: dayjs().toDate(),
              },
            },
            premium_activated_at: dayjs().toDate(),
          }
        ),
      ])

      // Gets all mails (formation email + formateur email), excepted "email_decisionnaire"
      let emails = widgetParametersFound.map((widgetParameter) => widgetParameter.email_rdv)
      if (etablissement?.etablissement_formateur_courriel) {
        emails.push(etablissement.etablissement_formateur_courriel)
      }

      emails = uniq(emails).filter((email) => email !== etablissement.email_decisionnaire)

      await Promise.all(
        emails.map((email) =>
          mailer.sendEmail({
            to: email,
            subject: `La prise de rendez-vous est activée pour votre CFA sur Parcoursup`,
            template: mailTemplate["mail-cfa-premium-activated"],
            data: {
              images: {
                logo: `${config.publicUrlEspacePro}/assets/logo-lba-recruteur-cfa.png?raw=true`,
                logoFooter: `${config.publicUrlEspacePro}/assets/logo-republique-francaise.png?raw=true`,
                peopleLaptop: `${config.publicUrlEspacePro}/assets/people-laptop.png?raw=true`,
              },
              etablissement: {
                name: etablissement.raison_sociale,
                address: etablissement.adresse,
                postalCode: etablissement.code_postal,
                ville: etablissement.localite,
                siret: etablissement.siret_formateur,
                email: etablissement.email_decisionnaire,
                premiumActivatedDate: dayjs(etablissement.premium_activated_at).format("dd/mm"),
                emailGestionnaire: etablissement.email_decisionnaire,
              },
              user: {
                destinataireEmail: email,
              },
            },
            from: config.email,
          })
        )
      )

      const [etablissementUpdated] = await Promise.all([
        etablissements.findById(req.params.id),
        ...widgetParametersFound.map((widgetParameter) =>
          widgetParameters.updateMany(
            { _id: widgetParameter._id, email_rdv: { $nin: [null, ""] } },
            {
              referrers: [...new Set([...widgetParameter.referrers, referrers.PARCOURSUP.code])],
            }
          )
        ),
      ])

      return res.send(etablissementUpdated)
    })
  )

  /**
   * @description Refuses Premium
   */
  router.post(
    "/:id/premium/refuse",
    tryCatch(async (req, res) => {
      const etablissement = await etablissements.findById(req.params.id)

      if (!etablissement) {
        throw Boom.badRequest("Etablissement not found.")
      }

      if (etablissement.premium_refused_at) {
        throw Boom.badRequest("Premium already refused.")
      }

      if (etablissement.premium_activated_at) {
        throw Boom.badRequest("Premium already activated.")
      }

      const { messageId } = await mailer.sendEmail({
        to: etablissement.email_decisionnaire,
        subject: `Le service “RDV Apprentissage” ne sera pas activé sur Parcoursup`,
        template: mailTemplate["mail-cfa-premium-refused"],
        data: {
          images: {
            informationIcon: `${config.publicUrlEspacePro}/assets/icon-information-blue.png?raw=true`,
            logoCandidat: `${config.publicUrlEspacePro}/assets/logo-lba-recruteur-candidat.png?raw=true`,
            logoCfa: `${config.publicUrlEspacePro}/assets/logo-lba-recruteur-cfa.png?raw=true`,
            logoFooter: `${config.publicUrlEspacePro}/assets/logo-republique-francaise.png?raw=true`,
          },
          etablissement: {
            name: etablissement.raison_sociale,
            address: etablissement.adresse,
            postalCode: etablissement.code_postal,
            ville: etablissement.localite,
            siret: etablissement.siret_formateur,
            email: etablissement.email_decisionnaire,
          },
          activationDate: dayjs().format("DD/MM"),
        },
        from: config.email,
      })

      await etablissements.findOneAndUpdate(
        { _id: etablissement._id },
        {
          $push: {
            mailing: {
              campaign: mailType.PREMIUM_REFUSED,
              status: null,
              message_id: messageId,
              email_sent_at: dayjs().toDate(),
            },
          },
          premium_refused_at: dayjs().toDate(),
        }
      )

      const etablissementUpdated = await etablissements.findById(req.params.id)

      return res.send(etablissementUpdated)
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

      console.log({ etablissement, appointment })

      if (!etablissement) {
        throw Boom.badRequest("Etablissement not found.")
      }

      if (!appointment || appointment.etablissement_id !== etablissement.siret_formateur) {
        throw Boom.badRequest("Appointment not found.")
      }

      // Save current date
      if (!appointment.cfa_read_appointment_details_at && has_been_read) {
        await appointment.update({ cfa_read_appointment_details_at: dayjs().toDate() })
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

      if (etablissement.opt_out_refused_at) {
        return res.sendStatus(400)
      }

      if (opt_out_question) {
        await etablissements.findByIdAndUpdate(req.params.id, {
          opt_out_question,
        })

        etablissement = await etablissements.findById(req.params.id)

        await mailer.sendEmail({
          to: config.email,
          subject: `Un CFA se pose une question concernant l'opt-out"`,
          template: mailTemplate["mail-rdva-optout-unsubscription-question"],
          data: {
            images: {
              logoCfa: `${config.publicUrlEspacePro}/assets/logo-lba-recruteur-cfa.png?raw=true`,
              logoFooter: `${config.publicUrlEspacePro}/assets/logo-republique-francaise.png?raw=true`,
            },
            etablissement: {
              name: etablissement.raison_sociale,
              address: etablissement.adresse,
              postalCode: etablissement.code_postal,
              ville: etablissement.localite,
              opt_out_question: etablissement.opt_out_question,
            },
            user: {
              destinataireEmail: etablissement.email_decisionnaire,
            },
          },
          from: etablissement.email_decisionnaire,
        })

        return res.send(etablissement)
      }

      // If opt-out is already running but user unsubscribe, disable all formations
      if (etablissement.opt_out_activated_at && dayjs(etablissement.opt_out_activated_at).isBefore(dayjs())) {
        // Disable all formations
        await widgetParameters.updateMany(
          {
            etablissement_siret: etablissement.siret_formateur,
          },
          {
            referrers: [],
          }
        )
      }

      await etablissements.findByIdAndUpdate(req.params.id, {
        opt_out_refused_at: dayjs().toDate(),
      })

      const { messageId } = await mailer.sendEmail({
        to: etablissement.email_decisionnaire,
        subject: `Désincription au service “RDV Apprentissage”`,
        template: mailTemplate["mail-cfa-optout-unsubscription"],
        data: {
          images: {
            logoCfa: `${config.publicUrlEspacePro}/assets/logo-lba-recruteur-cfa.png?raw=true`,
            logoFooter: `${config.publicUrlEspacePro}/assets/logo-republique-francaise.png?raw=true`,
          },
          etablissement: {
            name: etablissement.raison_sociale,
            address: etablissement.adresse,
            postalCode: etablissement.code_postal,
            ville: etablissement.localite,
            siret: etablissement.siret_formateur,
          },
          user: {
            destinataireEmail: etablissement.email_decisionnaire,
          },
        },
        from: config.email,
      })

      await etablissements.findOneAndUpdate(
        { _id: etablissement._id },
        {
          $push: {
            mailing: {
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
