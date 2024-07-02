import Boom from "boom"
import * as _ from "lodash-es"
import { ObjectId } from "mongodb"
import { zRoutes } from "shared"
import { referrers } from "shared/constants/referers"

import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sendMailCfaPremiumStart } from "@/services/etablissement.service"

import config from "../../config"
import dayjs from "../../services/dayjs.service"
import * as eligibleTrainingsForAppointmentService from "../../services/eligibleTrainingsForAppointment.service"
import mailer, { sanitizeForEmail } from "../../services/mailer.service"
import { Server } from "../server"

const etablissementProjection = {
  optout_refusal_date: 1,
  raison_sociale: 1,
  formateur_siret: 1,
  formateur_address: 1,
  formateur_zip_code: 1,
  formateur_city: 1,
  premium_refusal_date: 1,
  premium_activation_date: 1,
  gestionnaire_siret: 1,
  premium_affelnet_refusal_date: 1,
  premium_affelnet_activation_date: 1,
}

/**
 * @description Etablissement server.
 */
export default (server: Server) => {
  /**
   * @description Returns etablissement from its id.
   */
  server.get(
    "/etablissements/:id",
    {
      schema: zRoutes.get["/etablissements/:id"],
      onRequest: [server.auth(zRoutes.get["/etablissements/:id"])],
    },
    async (req, res) => {
      const etablissement = await getDbCollection("etablissements").findOne({ _id: new ObjectId(req.params.id.toString()) }, { projection: etablissementProjection })

      if (!etablissement) {
        throw Boom.notFound()
      }

      return res.send(etablissement)
    }
  )

  /**
   * @description Accepts "Premium Affelnet".
   */
  server.post(
    "/etablissements/:id/premium/affelnet/accept",
    {
      schema: zRoutes.post["/etablissements/:id/premium/affelnet/accept"],
      onRequest: [server.auth(zRoutes.post["/etablissements/:id/premium/affelnet/accept"])],
    },
    async (req, res) => {
      const etablissement = await getDbCollection("etablissements").findOne({ _id: new ObjectId(req.params.id.toString()) })

      if (!etablissement) {
        throw Boom.badRequest("Etablissement not found.")
      }

      if (etablissement.premium_affelnet_activation_date) {
        throw Boom.badRequest("Premium already activated.")
      }

      if (!etablissement.gestionnaire_email) {
        throw Boom.badRequest("Gestionnaire email not found")
      }

      await sendMailCfaPremiumStart(etablissement, "affelnet")

      const [eligibleTrainingsForAppointmentsAffelnetFound, etablissementAffelnetUpdated] = await Promise.all([
        eligibleTrainingsForAppointmentService.find({
          etablissement_formateur_siret: etablissement.formateur_siret,
          affelnet_visible: true,
        }),
        getDbCollection("etablissements").findOneAndUpdate(
          { _id: etablissement._id },
          {
            $set: { premium_affelnet_activation_date: dayjs().toDate() },
          },
          { returnDocument: "after" }
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
                logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
                logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.png?raw=true`,
                peopleLaptop: `${config.publicUrl}/assets/people-laptop.png?raw=true`,
              },
              etablissement: {
                email,
                name: etablissement.raison_sociale,
                formateur_address: etablissement.formateur_address,
                formateur_zip_code: etablissement.formateur_zip_code,
                formateur_city: etablissement.formateur_city,
                siret: etablissement.formateur_siret,
                premiumAffelnetActivatedDate: dayjs(etablissementAffelnetUpdated?.premium_affelnet_activation_date).format("DD/MM/YYYY"),
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
        await getDbCollection("etablissements").findOne({ _id: req.params.id }, { projection: etablissementProjection }),
        ...eligibleTrainingsForAppointmentsAffelnetFound.map((eligibleTrainingsForAppointment) =>
          getDbCollection("eligible_trainings_for_appointments").updateOne(
            { _id: eligibleTrainingsForAppointment._id, lieu_formation_email: { $nin: [null, ""] } },
            {
              $set: { referrers: [...new Set([...eligibleTrainingsForAppointment.referrers, referrers.AFFELNET.name])] },
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
    "/etablissements/:id/premium/accept",
    {
      schema: zRoutes.post["/etablissements/:id/premium/accept"],
      onRequest: [server.auth(zRoutes.post["/etablissements/:id/premium/accept"])],
    },
    async (req, res) => {
      const etablissement = await getDbCollection("etablissements").findOne({ _id: new ObjectId(req.params.id.toString()) })

      if (!etablissement) {
        throw Boom.badRequest("Etablissement not found.")
      }

      if (etablissement.premium_activation_date) {
        throw Boom.badRequest("Premium Parcoursup already activated.")
      }

      if (!etablissement.gestionnaire_email) {
        throw Boom.badRequest("Gestionnaire email not found")
      }

      await sendMailCfaPremiumStart(etablissement, "parcoursup")

      const [eligibleTrainingsForAppointmentsParcoursupFound, etablissementParcoursupUpdated] = await Promise.all([
        eligibleTrainingsForAppointmentService.find({
          etablissement_formateur_siret: etablissement.formateur_siret,
          parcoursup_id: {
            $ne: null,
          },
          parcoursup_visible: true,
        }),
        getDbCollection("etablissements").findOneAndUpdate(
          { _id: etablissement._id },
          {
            $set: { premium_activation_date: dayjs().toDate() },
          },
          { returnDocument: "after" }
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
                logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
                logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.png?raw=true`,
                peopleLaptop: `${config.publicUrl}/assets/people-laptop.png?raw=true`,
              },
              etablissement: {
                email,
                name: etablissement.raison_sociale,
                formateur_address: etablissement.formateur_address,
                formateur_zip_code: etablissement.formateur_zip_code,
                formateur_city: etablissement.formateur_city,
                siret: etablissement.formateur_siret,
                premiumActivatedDate: dayjs(etablissementParcoursupUpdated?.premium_activation_date).format("DD/MM/YYYY"),
                premiumAffelnetActivatedDate: dayjs(etablissementParcoursupUpdated?.premium_affelnet_activation_date).format("DD/MM/YYYY"),
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
        await getDbCollection("etablissements").findOne({ _id: new ObjectId(req.params.id.toString()) }),
        ...eligibleTrainingsForAppointmentsParcoursupFound.map((eligibleTrainingsForAppointment) =>
          eligibleTrainingsForAppointmentService.findOneAndUpdate(
            { _id: eligibleTrainingsForAppointment._id, lieu_formation_email: { $nin: [null, ""] } },
            {
              $set: { referrers: [...new Set([...eligibleTrainingsForAppointment.referrers, referrers.PARCOURSUP.name])] },
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
    "/etablissements/:id/premium/affelnet/refuse",
    {
      schema: zRoutes.post["/etablissements/:id/premium/affelnet/refuse"],
      onRequest: [server.auth(zRoutes.post["/etablissements/:id/premium/affelnet/refuse"])],
    },
    async (req, res) => {
      const etablissement = await getDbCollection("etablissements").findOne({ _id: new ObjectId(req.params.id) })

      if (!etablissement) {
        throw Boom.badRequest("Etablissement not found.")
      }

      if (etablissement.premium_affelnet_refusal_date) {
        throw Boom.badRequest("Premium Affelnet already refused.")
      }

      if (etablissement.premium_affelnet_activation_date) {
        throw Boom.badRequest("Premium Affelnet already activated.")
      }

      if (!etablissement.gestionnaire_email) {
        throw Boom.badRequest("Gestionnaire email not found")
      }

      await mailer.sendEmail({
        to: etablissement.gestionnaire_email,
        subject: `La prise de RDV ne sera pas activée pour votre CFA sur Choisir son affectation après la 3e`,
        template: getStaticFilePath("./templates/mail-cfa-premium-refused.mjml.ejs"),
        data: {
          isAffelnet: true,
          images: {
            informationIcon: `${config.publicUrl}/assets/icon-information-blue.png?raw=true`,
            logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
            logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.png?raw=true`,
          },
          etablissement: {
            raison_sociale: etablissement.raison_sociale,
            formateur_address: etablissement.formateur_address,
            formateur_zip_code: etablissement.formateur_zip_code,
            formateur_city: etablissement.formateur_city,
            formateur_siret: etablissement.formateur_siret,
            email: etablissement.gestionnaire_email,
          },
          activationDate: dayjs().format("DD/MM/YYYY"),
        },
      })

      await await getDbCollection("etablissements").findOneAndUpdate(
        { _id: etablissement._id },
        {
          projection: { premium_affelnet_refusal_date: dayjs().toDate() },
        }
      )

      const etablissementAffelnetUpdated = await getDbCollection("etablissements").findOne({ _id: new ObjectId(req.params.id) }, { projection: etablissementProjection })
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
    "/etablissements/:id/premium/refuse",
    {
      schema: zRoutes.post["/etablissements/:id/premium/refuse"],
      onRequest: [server.auth(zRoutes.post["/etablissements/:id/premium/refuse"])],
    },
    async (req, res) => {
      const etablissement = await getDbCollection("etablissements").findOne({ _id: new ObjectId(req.params.id) })

      if (!etablissement) {
        throw Boom.badRequest("Etablissement not found.")
      }

      if (etablissement.premium_refusal_date) {
        throw Boom.badRequest("Premium Parcoursup already refused.")
      }

      if (etablissement.premium_activation_date) {
        throw Boom.badRequest("Premium Parcoursup already activated.")
      }

      if (!etablissement.gestionnaire_email) {
        throw Boom.badRequest("Gestionnaire email not found")
      }

      await mailer.sendEmail({
        to: etablissement.gestionnaire_email,
        subject: `La prise de RDV ne sera pas activée pour votre CFA sur Parcoursup`,
        template: getStaticFilePath("./templates/mail-cfa-premium-refused.mjml.ejs"),
        data: {
          isParcoursup: true,
          images: {
            informationIcon: `${config.publicUrl}/assets/icon-information-blue.png?raw=true`,
            logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
            logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.png?raw=true`,
          },
          etablissement: {
            raison_sociale: etablissement.raison_sociale,
            formateur_address: etablissement.formateur_address,
            formateur_zip_code: etablissement.formateur_zip_code,
            formateur_city: etablissement.formateur_city,
            formateur_siret: etablissement.formateur_siret,
            email: etablissement.gestionnaire_email,
          },
          activationDate: dayjs().format("DD/MM/YYYY"),
        },
      })

      await getDbCollection("etablissements").findOneAndUpdate(
        { _id: etablissement._id },
        {
          $set: { premium_refusal_date: dayjs().toDate() },
        }
      )

      const etablissementParcoursupUpdated = await getDbCollection("etablissements").findOne(
        { _id: new ObjectId(req.params.id.toString()) },
        { projection: etablissementProjection }
      )
      if (!etablissementParcoursupUpdated) {
        throw new Error(`unexpected: could not find etablissement with id=${req.params.id}`)
      }
      return res.send(etablissementParcoursupUpdated)
    }
  )

  /**
   * @description OptOutUnsubscribe to "opt-out".
   */
  server.post(
    "/etablissements/:id/opt-out/unsubscribe",
    {
      schema: zRoutes.post["/etablissements/:id/opt-out/unsubscribe"],
      onRequest: [server.auth(zRoutes.post["/etablissements/:id/opt-out/unsubscribe"])],
    },
    async (req, res) => {
      let etablissement = await getDbCollection("etablissements").findOne(
        { _id: new ObjectId(req.params.id.toString()) },
        { projection: { ...etablissementProjection, gestionnaire_email: 1 } }
      )

      if (!etablissement || etablissement.optout_refusal_date) {
        throw Boom.notFound()
      }

      if ("opt_out_question" in req.body) {
        await mailer.sendEmail({
          to: config.publicEmail,
          subject: `Un CFA se pose une question concernant l'opt-out"`,
          template: getStaticFilePath("./templates/mail-rdva-optout-unsubscription-question.mjml.ejs"),
          data: {
            images: {
              logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
              logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.png?raw=true`,
            },
            etablissement: {
              name: etablissement.raison_sociale,
              formateur_address: etablissement.formateur_address,
              formateur_zip_code: etablissement.formateur_zip_code,
              formateur_city: etablissement.formateur_city,
              opt_out_question: sanitizeForEmail(req.body.opt_out_question),
            },
          },
          from: config.transactionalEmail,
        })

        return res.send(etablissement)
      }

      // If opt-out is already running but user unsubscribe, disable all formations
      /**
       * WARNING KBA 2024-02-12 : ALL REFERRERS ARE REMOVED AND ITS BAD IF PREMIUM IS AVAILABLE
       */
      if (etablissement.optout_activation_date && dayjs(etablissement.optout_activation_date).isBefore(dayjs())) {
        // Disable all formations
        await eligibleTrainingsForAppointmentService.updateMany(
          {
            etablissement_formateur_siret: etablissement.formateur_siret,
          },
          {
            $set: {
              referrers: [],
            },
          }
        )
      }

      await getDbCollection("etablissements").findOneAndUpdate(
        { _id: new ObjectId(req.params.id.toString()) },
        {
          $set: { optout_refusal_date: dayjs().toDate() },
        }
      )

      if (!etablissement.gestionnaire_email) {
        throw Boom.badRequest("Gestionnaire email not found")
      }

      await mailer.sendEmail({
        to: etablissement.gestionnaire_email,
        subject: `La prise de RDV ne sera pas activée pour votre CFA sur La bonne alternance`,
        template: getStaticFilePath("./templates/mail-cfa-optout-unsubscription.mjml.ejs"),
        data: {
          images: {
            logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
            logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.png?raw=true`,
          },
          etablissement: {
            name: etablissement.raison_sociale,
            formateur_address: etablissement.formateur_address,
            formateur_zip_code: etablissement.formateur_zip_code,
            formateur_city: etablissement.formateur_city,
            siret: etablissement.formateur_siret,
          },
        },
      })

      etablissement = await getDbCollection("etablissements").findOne({ _id: new ObjectId(req.params.id) }, { projection: etablissementProjection })
      if (!etablissement) {
        throw new Error(`unexpected: could not find appointment with id=${req.params.id}`)
      }

      return res.send(etablissement)
    }
  )
}
