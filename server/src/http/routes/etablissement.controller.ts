import Boom from "boom"
import Joi from "joi"
import * as _ from "lodash-es"
import { IAppointment, zRoutes } from "shared"
import { referrers } from "shared/constants/referers"

import { getStaticFilePath } from "@/common/utils/getStaticFilePath"

import { mailType } from "../../common/model/constants/etablissement"
import { Appointment, Etablissement } from "../../common/model/index"
import config from "../../config"
import * as appointmentService from "../../services/appointment.service"
import dayjs from "../../services/dayjs.service"
import * as eligibleTrainingsForAppointmentService from "../../services/eligibleTrainingsForAppointment.service"
import mailer from "../../services/mailer.service"
import { Server } from "../server"

const optOutUnsubscribeSchema = Joi.object({
  opt_out_question: Joi.string().optional(),
})

const patchEtablissementIdAppointmentIdReadAppointSchema = Joi.object({
  has_been_read: Joi.boolean().required(),
})

/**
 * @description Etablissement server.
 */
export default (server: Server) => {
  /**
   * @description Returns etablissement from its id.
   */
  server.get(
    "/api/etablissements/:id",
    {
      schema: zRoutes.get["/api/etablissements/:id"],
    },
    async (req, res) => {
      const etablissement = await Etablissement.findById(req.params.id)

      if (!etablissement) {
        return res.status(404).send()
      }

      return res.send(etablissement)
    }
  )

  /**
   * @description Accepts "Premium Affelnet".
   */
  server.post(
    "/api/etablissements/:id/premium/affelnet/accept",
    {
      schema: zRoutes.post["/api/etablissements/:id/premium/affelnet/accept"],
    },
    async (req, res) => {
      const etablissement = await Etablissement.findById(req.params.id)

      if (!etablissement) {
        throw Boom.badRequest("Etablissement not found.")
      }

      if (etablissement.premium_affelnet_activation_date) {
        throw Boom.badRequest("Premium already activated.")
      }

      const mailAffelnet = await mailer.sendEmail({
        to: etablissement.gestionnaire_email,
        subject: `La prise de RDV est activée pour votre CFA sur Choisir son affectation après la 3e`,
        template: getStaticFilePath("./templates/mail-cfa-premium-start.mjml.ejs"),
        data: {
          isAffelnet: true,
          images: {
            logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
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
        eligibleTrainingsForAppointmentService.find({
          etablissement_formateur_siret: etablissement.formateur_siret,
        }),
        Etablissement.findOneAndUpdate(
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
      emailsAffelnet = [...new Set(emailsAffelnet.filter((email) => !_.isNil(email) && email !== etablissement.gestionnaire_email))]

      await Promise.all(
        emailsAffelnet.map((email) =>
          mailer.sendEmail({
            // TODO string | null
            to: email as string,
            subject: `La prise de RDV est activée pour votre CFA sur Choisir son affectation après la 3e`,
            template: getStaticFilePath("./templates/mail-cfa-premium-activated.mjml.ejs"),
            data: {
              isAffelnet: true,
              url: config.publicUrl,
              replyTo: `${config.publicEmail}?subject=Email%20CFA%20Premium%20invite%20-%20MAJ%20contact%20formation`,
              images: {
                logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
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
                premiumActivatedDate: dayjs(etablissementAffelnetUpdated?.premium_affelnet_activation_date).format("DD/MM"),
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
        Etablissement.findById(req.params.id),
        ...eligibleTrainingsForAppointmentsAffelnetFound.map((eligibleTrainingsForAppointment) =>
          eligibleTrainingsForAppointmentService.update(
            { _id: eligibleTrainingsForAppointment._id, lieu_formation_email: { $nin: [null, ""] } },
            {
              referrers: [...new Set([...eligibleTrainingsForAppointment.referrers, referrers.AFFELNET.name])],
            }
          )
        ),
      ])
      if (!resultAffelnet) {
        throw new Error(`unexpected: could not find etablissement with id=${req.params.id}`)
      }
      return res.send(resultAffelnet)
    }
  )

  /**
   * @description Accepts "Premium Parcoursup".
   */
  server.post(
    "/api/etablissements/:id/premium/accept",
    {
      schema: zRoutes.post["/api/etablissements/:id/premium/accept"],
    },
    async (req, res) => {
      const etablissement = await Etablissement.findById(req.params.id)

      if (!etablissement) {
        throw Boom.badRequest("Etablissement not found.")
      }

      if (etablissement.premium_activation_date) {
        throw Boom.badRequest("Premium Parcoursup already activated.")
      }

      const mailParcoursup = await mailer.sendEmail({
        to: etablissement.gestionnaire_email,
        subject: `La prise de RDV est activée pour votre CFA sur Parcoursup`,
        template: getStaticFilePath("./templates/mail-cfa-premium-start.mjml.ejs"),
        data: {
          isParcoursup: true,
          images: {
            logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
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
        eligibleTrainingsForAppointmentService.find({
          etablissement_formateur_siret: etablissement.formateur_siret,
          parcoursup_id: {
            $ne: null,
          },
        }),
        Etablissement.findOneAndUpdate(
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
      emailsParcoursup = [...new Set(emailsParcoursup.filter((email) => !_.isNil(email) && email !== etablissement.gestionnaire_email))]

      await Promise.all(
        emailsParcoursup.map((email) =>
          mailer.sendEmail({
            // TODO string | null
            to: email as string,
            subject: `La prise de RDV est activée pour votre CFA sur Parcoursup`,
            template: getStaticFilePath("./templates/mail-cfa-premium-activated.mjml.ejs"),
            data: {
              isParcoursup: true,
              url: config.publicUrl,
              replyTo: `${config.publicEmail}?subject=Email%20CFA%20Premium%20invite%20-%20MAJ%20contact%20formation`,
              images: {
                logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
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
                premiumActivatedDate: dayjs(etablissementParcoursupUpdated?.premium_activation_date).format("DD/MM"),
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
        Etablissement.findById(req.params.id),
        ...eligibleTrainingsForAppointmentsParcoursupFound.map((eligibleTrainingsForAppointment) =>
          eligibleTrainingsForAppointmentService.update(
            { _id: eligibleTrainingsForAppointment._id, lieu_formation_email: { $nin: [null, ""] } },
            {
              referrers: [...new Set([...eligibleTrainingsForAppointment.referrers, referrers.PARCOURSUP.name])],
            }
          )
        ),
      ])
      if (!result) {
        throw new Error(`unexpected: could not find etablissement with id=${req.params.id}`)
      }
      return res.send(result)
    }
  )

  /**
   * @description Refuses "Premium Affelnet"
   */
  server.post(
    "/api/etablissements/:id/premium/affelnet/refuse",
    {
      schema: zRoutes.post["/api/etablissements/:id/premium/affelnet/refuse"],
    },
    async (req, res) => {
      const etablissement = await Etablissement.findById(req.params.id)

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
        subject: `La prise de RDV ne sera pas activée pour votre CFA sur Choisir son affectation après la 3e`,
        template: getStaticFilePath("./templates/mail-cfa-premium-refused.mjml.ejs"),
        data: {
          isAffelnet: true,
          images: {
            informationIcon: `${config.publicUrlEspacePro}/assets/icon-information-blue.png?raw=true`,
            logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
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

      await Etablissement.findOneAndUpdate(
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

      const etablissementAffelnetUpdated = await Etablissement.findById(req.params.id)
      if (!etablissementAffelnetUpdated) {
        throw new Error(`unexpected: could not find etablissement with id=${req.params.id}`)
      }
      return res.send(etablissementAffelnetUpdated)
    }
  )

  /**
   * @description Refuses "Premium Parcoursup"
   */
  server.post(
    "/api/etablissements/:id/premium/refuse",
    {
      schema: zRoutes.post["/api/etablissements/:id/premium/refuse"],
    },
    async (req, res) => {
      const etablissement = await Etablissement.findById(req.params.id)

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
        subject: `La prise de RDV ne sera pas activée pour votre CFA sur Parcoursup`,
        template: getStaticFilePath("./templates/mail-cfa-premium-refused.mjml.ejs"),
        data: {
          isParcoursup: true,
          images: {
            informationIcon: `${config.publicUrlEspacePro}/assets/icon-information-blue.png?raw=true`,
            logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
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

      await Etablissement.findOneAndUpdate(
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

      const etablissementParcoursupUpdated = await Etablissement.findById(req.params.id)
      if (!etablissementParcoursupUpdated) {
        throw new Error(`unexpected: could not find etablissement with id=${req.params.id}`)
      }
      return res.send(etablissementParcoursupUpdated)
    }
  )

  /**
   * Patch etablissement appointment.
   */
  server.patch(
    "/api/etablissements/:id/appointments/:appointmentId",
    {
      schema: zRoutes.patch["/api/etablissements/:id/appointments/:appointmentId"],
    },
    async ({ body, params }, res) => {
      const { has_been_read } = await patchEtablissementIdAppointmentIdReadAppointSchema.validateAsync(body, {
        abortEarly: false,
      })

      const { id, appointmentId } = params

      // eslint-disable-next-line prefer-const
      let [etablissement, appointment]: [any, IAppointment | null] = await Promise.all([Etablissement.findById(id), Appointment.findById(appointmentId)])

      if (!etablissement) {
        throw Boom.badRequest("Etablissement not found.")
      }

      if (!appointment || appointment.cfa_formateur_siret !== etablissement.formateur_siret) {
        throw Boom.badRequest("Appointment not found.")
      }

      // Save current date
      if (!appointment.cfa_read_appointment_details_date && has_been_read) {
        await appointmentService.updateAppointment(appointmentId.toString(), { cfa_read_appointment_details_date: dayjs().toDate() })
      }

      appointment = (await Appointment.findById(appointmentId)) as IAppointment | null
      if (!appointment) {
        throw new Error(`unexpected: could not find appointment with id=${appointmentId}`)
      }

      res.send(appointment)
    }
  )

  /**
   * @description OptOutUnsubscribe to "opt-out".
   */
  server.post(
    "/api/etablissements/:id/opt-out/unsubscribe",
    {
      schema: zRoutes.post["/api/etablissements/:id/opt-out/unsubscribe"],
    },
    async (req, res) => {
      const { opt_out_question } = await optOutUnsubscribeSchema.validateAsync(req.body, { abortEarly: false })

      let etablissement = await Etablissement.findById(req.params.id)

      if (!etablissement) {
        return res.status(404).send()
      }

      if (etablissement.optout_refusal_date) {
        return res.status(400).send()
      }

      if (opt_out_question) {
        await mailer.sendEmail({
          to: config.publicEmail,
          subject: `Un CFA se pose une question concernant l'opt-out"`,
          template: getStaticFilePath("./templates/mail-rdva-optout-unsubscription-question.mjml.ejs"),
          data: {
            images: {
              logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
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
        await eligibleTrainingsForAppointmentService.updateMany(
          {
            etablissement_formateur_siret: etablissement.formateur_siret,
          },
          {
            referrers: [],
          }
        )
      }

      await Etablissement.findByIdAndUpdate(req.params.id, {
        optout_refusal_date: dayjs().toDate(),
      })

      const { messageId } = await mailer.sendEmail({
        to: etablissement.gestionnaire_email,
        subject: `La prise de RDV ne sera pas activée pour votre CFA sur La bonne alternance`,
        template: getStaticFilePath("./templates/mail-cfa-optout-unsubscription.mjml.ejs"),
        data: {
          images: {
            logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
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

      await Etablissement.findOneAndUpdate(
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

      etablissement = await Etablissement.findById(req.params.id)
      if (!etablissement) {
        throw new Error(`unexpected: could not find appointment with id=${req.params.id}`)
      }

      return res.send(etablissement)
    }
  )
}
