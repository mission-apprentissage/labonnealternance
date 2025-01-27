import { badRequest, notFound } from "@hapi/boom"
import * as _ from "lodash-es"
import { ObjectId } from "mongodb"
import { zRoutes } from "shared"
import { referrers } from "shared/constants/referers"

import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sendMailCfaPremiumStart } from "@/services/etablissement.service"

import { removeHtmlTagsFromString } from "../../common/utils/stringUtils"
import config from "../../config"
import dayjs from "../../services/dayjs.service"
import * as eligibleTrainingsForAppointmentService from "../../services/eligibleTrainingsForAppointment.service"
import mailer from "../../services/mailer.service"
import { Server } from "../server"

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
      const etablissement = await getDbCollection("etablissements").findOne(
        { _id: new ObjectId(req.params.id.toString()) },
        {
          projection: {
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
          },
        }
      )

      if (!etablissement) {
        throw notFound("Etablissement not found.")
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
      let etablissement = await getDbCollection("etablissements").findOne({ _id: new ObjectId(req.params.id.toString()) })

      if (!etablissement) {
        throw badRequest("Etablissement not found.")
      }

      if (etablissement.premium_affelnet_activation_date) {
        throw badRequest("Premium already activated.")
      }

      if (!etablissement.gestionnaire_email) {
        throw badRequest("Gestionnaire email not found")
      }

      await sendMailCfaPremiumStart(etablissement, "affelnet")

      // update establishment with premium activation date
      etablissement = await getDbCollection("etablissements").findOneAndUpdate(
        { _id: etablissement._id },
        {
          $set: { premium_affelnet_activation_date: new Date() },
        },
        { returnDocument: "after" }
      )

      const eligibleTrainingsForAppointmentsAffelnetFound = await eligibleTrainingsForAppointmentService.find({
        etablissement_formateur_siret: etablissement!.formateur_siret,
        affelnet_visible: true,
      })

      // Gets all mails (formation email + formateur email), excepted "email_decisionnaire"
      let emailsAffelnet = eligibleTrainingsForAppointmentsAffelnetFound.map((eligibleTrainingsForAppointment) => eligibleTrainingsForAppointment.lieu_formation_email)
      emailsAffelnet = [...new Set(emailsAffelnet.filter((email) => !_.isNil(email) && email !== etablissement!.gestionnaire_email))]

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
                logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.webp?raw=true`,
                peopleLaptop: `${config.publicUrl}/assets/people-laptop.webp?raw=true`,
              },
              etablissement: {
                email,
                name: etablissement!.raison_sociale,
                formateur_address: etablissement!.formateur_address,
                formateur_zip_code: etablissement!.formateur_zip_code,
                formateur_city: etablissement!.formateur_city,
                siret: etablissement!.formateur_siret,
                premiumAffelnetActivatedDate: dayjs(etablissement!.premium_affelnet_activation_date).format("DD/MM/YYYY"),
                emailGestionnaire: etablissement!.gestionnaire_email,
              },
              user: {
                destinataireEmail: email,
              },
            },
          })
        )
      )

      // update all eligible trainings for appointments with referrer AFFELNET
      const eligibleTrainingsForAppointmentsIdsToUpdate = eligibleTrainingsForAppointmentsAffelnetFound.map((doc) => doc._id)
      await getDbCollection("eligible_trainings_for_appointments").updateMany(
        { _id: { $in: eligibleTrainingsForAppointmentsIdsToUpdate } },
        { $push: { referrers: referrers.AFFELNET.name } }
      )

      return res.send(etablissement!)
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
      let etablissement = await getDbCollection("etablissements").findOne({ _id: new ObjectId(req.params.id.toString()) })

      if (!etablissement) {
        throw badRequest("Etablissement not found.")
      }

      if (etablissement.premium_activation_date) {
        throw badRequest("Premium Parcoursup already activated.")
      }

      if (!etablissement.gestionnaire_email) {
        throw badRequest("Gestionnaire email not found")
      }

      await sendMailCfaPremiumStart(etablissement, "parcoursup")

      // update establishment with premium activation date
      etablissement = await getDbCollection("etablissements").findOneAndUpdate(
        { _id: etablissement._id },
        {
          $set: { premium_activation_date: new Date() },
        },
        { returnDocument: "after" }
      )

      const eligibleTrainingsForAppointmentsParcoursupFound = await eligibleTrainingsForAppointmentService.find({
        etablissement_formateur_siret: etablissement!.formateur_siret,
        parcoursup_id: {
          $ne: null,
        },
        parcoursup_visible: true,
      })

      // Gets all mails (formation email + formateur email), excepted "email_decisionnaire"
      let emailsParcoursup = eligibleTrainingsForAppointmentsParcoursupFound.map((eligibleTrainingsForAppointment) => eligibleTrainingsForAppointment.lieu_formation_email)
      emailsParcoursup = [...new Set(emailsParcoursup.filter((email) => !_.isNil(email) && email !== etablissement!.gestionnaire_email))]

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
                logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.webp?raw=true`,
                peopleLaptop: `${config.publicUrl}/assets/people-laptop.webp?raw=true`,
              },
              etablissement: {
                email,
                name: etablissement!.raison_sociale,
                formateur_address: etablissement!.formateur_address,
                formateur_zip_code: etablissement!.formateur_zip_code,
                formateur_city: etablissement!.formateur_city,
                siret: etablissement!.formateur_siret,
                premiumActivatedDate: dayjs(etablissement!.premium_activation_date).format("DD/MM/YYYY"),
                premiumAffelnetActivatedDate: dayjs(etablissement!.premium_affelnet_activation_date).format("DD/MM/YYYY"),
                emailGestionnaire: etablissement!.gestionnaire_email,
              },
              user: {
                destinataireEmail: email,
              },
            },
          })
        )
      )

      // update all eligible trainings for appointments with referrer PARCOURSUP
      const eligibleTrainingsForAppointmentsIdsToUpdate = eligibleTrainingsForAppointmentsParcoursupFound.map((doc) => doc._id)
      await getDbCollection("eligible_trainings_for_appointments").updateMany(
        { _id: { $in: eligibleTrainingsForAppointmentsIdsToUpdate } },
        { $push: { referrers: referrers.PARCOURSUP.name } }
      )

      return res.send(etablissement!)
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
      let etablissement = await getDbCollection("etablissements").findOne({ _id: new ObjectId(req.params.id) })

      if (!etablissement) {
        throw badRequest("Etablissement not found.")
      }

      if (etablissement.premium_affelnet_refusal_date) {
        throw badRequest("Premium Affelnet already refused.")
      }

      if (etablissement.premium_affelnet_activation_date) {
        throw badRequest("Premium Affelnet already activated.")
      }

      if (!etablissement.gestionnaire_email) {
        throw badRequest("Gestionnaire email not found")
      }

      await mailer.sendEmail({
        to: etablissement.gestionnaire_email,
        subject: `La prise de RDV ne sera pas activée pour votre CFA sur Choisir son affectation après la 3e`,
        template: getStaticFilePath("./templates/mail-cfa-premium-refused.mjml.ejs"),
        data: {
          isAffelnet: true,
          images: {
            informationIcon: `${config.publicUrl}/assets/icon-information-blue.webp?raw=true`,
            logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
            logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.webp?raw=true`,
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

      // update establishment with premium refusal date
      etablissement = await getDbCollection("etablissements").findOneAndUpdate(
        { _id: etablissement._id },
        {
          $set: { premium_affelnet_refusal_date: new Date() },
        },
        { returnDocument: "after" }
      )

      return res.send(etablissement!)
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
      let etablissement = await getDbCollection("etablissements").findOne({ _id: new ObjectId(req.params.id) })

      if (!etablissement) {
        throw badRequest("Etablissement not found.")
      }

      if (etablissement.premium_refusal_date) {
        throw badRequest("Premium Parcoursup already refused.")
      }

      if (etablissement.premium_activation_date) {
        throw badRequest("Premium Parcoursup already activated.")
      }

      if (!etablissement.gestionnaire_email) {
        throw badRequest("Gestionnaire email not found")
      }

      await mailer.sendEmail({
        to: etablissement.gestionnaire_email,
        subject: `La prise de RDV ne sera pas activée pour votre CFA sur Parcoursup`,
        template: getStaticFilePath("./templates/mail-cfa-premium-refused.mjml.ejs"),
        data: {
          isParcoursup: true,
          images: {
            informationIcon: `${config.publicUrl}/assets/icon-information-blue.webp?raw=true`,
            logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
            logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.webp?raw=true`,
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

      // update establishment with premium refusal date
      etablissement = await getDbCollection("etablissements").findOneAndUpdate(
        { _id: etablissement._id },
        {
          $set: { premium_refusal_date: new Date() },
        },
        { returnDocument: "after" }
      )

      return res.send(etablissement!)
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
      let etablissement = await getDbCollection("etablissements").findOne({ _id: new ObjectId(req.params.id.toString()) })

      if (!etablissement) {
        throw notFound("Etablissement not found.")
      }

      if ("opt_out_question" in req.body) {
        await mailer.sendEmail({
          to: config.publicEmail,
          subject: `Un CFA se pose une question concernant l'opt-out"`,
          template: getStaticFilePath("./templates/mail-rdva-optout-unsubscription-question.mjml.ejs"),
          data: {
            images: {
              logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
              logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.webp?raw=true`,
            },
            etablissement: {
              name: etablissement.raison_sociale,
              formateur_address: etablissement.formateur_address,
              formateur_zip_code: etablissement.formateur_zip_code,
              formateur_city: etablissement.formateur_city,
              opt_out_question: removeHtmlTagsFromString(req.body.opt_out_question),
            },
          },
          from: config.transactionalEmail,
        })

        return res.send(etablissement)
      }

      // If opt-out is already running but user unsubscribe, remove optout for all formations
      if (etablissement.optout_activation_date && dayjs(etablissement.optout_activation_date).isBefore(dayjs())) {
        await getDbCollection("eligible_trainings_for_appointments").updateMany(
          {
            etablissement_formateur_siret: etablissement.formateur_siret,
          },
          [
            {
              $set: {
                referrers: {
                  $filter: {
                    input: "$referrers",
                    as: "referrer",
                    cond: { $in: ["$$referrer", [referrers.PARCOURSUP.name, referrers.AFFELNET.name]] },
                  },
                },
              },
            },
          ]
        )
      }

      // update establishment with optout refusal date
      etablissement = await getDbCollection("etablissements").findOneAndUpdate(
        { _id: new ObjectId(req.params.id.toString()) },
        {
          $set: { optout_refusal_date: new Date() },
        },
        { returnDocument: "after" }
      )

      if (!etablissement!.gestionnaire_email) {
        throw badRequest("Gestionnaire email not found")
      }

      await mailer.sendEmail({
        to: etablissement!.gestionnaire_email,
        subject: `La prise de RDV ne sera pas activée pour votre CFA sur La bonne alternance`,
        template: getStaticFilePath("./templates/mail-cfa-optout-unsubscription.mjml.ejs"),
        data: {
          images: {
            logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
            logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.webp?raw=true`,
          },
          etablissement: {
            name: etablissement!.raison_sociale,
            formateur_address: etablissement!.formateur_address,
            formateur_zip_code: etablissement!.formateur_zip_code,
            formateur_city: etablissement!.formateur_city,
            siret: etablissement!.formateur_siret,
          },
        },
      })

      return res.send(etablissement!)
    }
  )
}
