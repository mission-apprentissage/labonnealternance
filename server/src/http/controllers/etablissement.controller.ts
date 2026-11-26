import { badRequest, notFound } from "@hapi/boom"
import type { FastifyRequest } from "fastify"
import * as _ from "lodash-es"
import { ObjectId } from "mongodb"
import { zRoutes } from "shared"

import dayjs from "shared/helpers/dayjs"
import { getStaticFilePath } from "@/common/utils/get-static-file-path"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sanitizeTextField } from "@/common/utils/string-utils"
import config from "@/config"
import type { Server } from "@/http/server"
import * as eligibleTrainingsForAppointmentService from "@/services/eligible-trainings-for-appointment.service"
import { sendMailCfaPremiumStart } from "@/services/etablissement.service"
import mailer from "@/services/mailer.service"
import { clearForcedActivationsAndRecompute, recomputeReferrers } from "@/services/referrers-diffusion.service"

// Placé avant server.auth : un jeton n'ouvre qu'un établissement, un id inconnu répondrait sinon 403 au lieu de 404.
const assertEtablissementExists = async (req: FastifyRequest) => {
  const { id } = req.params as { id: string }
  const exists = ObjectId.isValid(id) && (await getDbCollection("etablissements").countDocuments({ _id: new ObjectId(id) }, { limit: 1 })) > 0
  if (!exists) {
    throw notFound("Etablissement not found.")
  }
}

export default (server: Server) => {
  server.get(
    "/etablissements/:id",
    {
      schema: zRoutes.get["/etablissements/:id"],
      onRequest: [assertEtablissementExists, server.auth(zRoutes.get["/etablissements/:id"])],
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

      // Emails des lieux de formation, hors email décisionnaire (gestionnaire_email)
      const emailsAffelnet = [
        ...new Set(
          eligibleTrainingsForAppointmentsAffelnetFound
            .map((eligibleTrainingsForAppointment) => eligibleTrainingsForAppointment.lieu_formation_email)
            .filter((email): email is string => !_.isNil(email) && email !== etablissement!.gestionnaire_email)
        ),
      ]

      await Promise.all(
        emailsAffelnet.map(async (email) =>
          mailer.sendEmail({
            to: email,
            subject: `Le formulaire de contact La bonne alternance est activé pour votre CFA sur Choisir son affectation après la 3e`,
            template: getStaticFilePath("./templates/mail-cfa-premium-activated.mjml.ejs"),
            data: {
              isAffelnet: true,
              url: config.publicUrl,
              replyTo: `${config.publicEmail}?subject=Email%20CFA%20Premium%20invite%20-%20MAJ%20contact%20formation`,
              images: {
                logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
                logoRf: `${config.publicUrl}/images/emails/logo_rf.png?raw=true`,
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
              publicEmail: config.publicEmail,
              utmParams: "utm_source=lba&utm_medium=email&utm_campaign=lba_cfa_rdva-affelnet-confirmation-activation",
            },
          })
        )
      )

      await recomputeReferrers({ _id: { $in: eligibleTrainingsForAppointmentsAffelnetFound.map((doc) => doc._id) } })

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

      // Emails des lieux de formation, hors email décisionnaire (gestionnaire_email)
      const emailsParcoursup = [
        ...new Set(
          eligibleTrainingsForAppointmentsParcoursupFound
            .map((eligibleTrainingsForAppointment) => eligibleTrainingsForAppointment.lieu_formation_email)
            .filter((email): email is string => !_.isNil(email) && email !== etablissement!.gestionnaire_email)
        ),
      ]

      await Promise.all(
        emailsParcoursup.map(async (email) =>
          mailer.sendEmail({
            to: email,
            subject: `Le formulaire de contact La bonne alternance est activé pour votre CFA sur Parcoursup`,
            template: getStaticFilePath("./templates/mail-cfa-premium-activated.mjml.ejs"),
            data: {
              isParcoursup: true,
              url: config.publicUrl,
              replyTo: `${config.publicEmail}?subject=Email%20CFA%20Premium%20invite%20-%20MAJ%20contact%20formation`,
              images: {
                logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
                logoRf: `${config.publicUrl}/images/emails/logo_rf.png?raw=true`,
                logoParcoursup: `${config.publicUrl}/images/emails/logo_parcoursup.png`,
                optoutCfa: `${config.publicUrl}/images/emails/optout_cfa.png?raw=true`,
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
              publicEmail: config.publicEmail,
              utmParams: "utm_source=lba&utm_medium=email&utm_campaign=lba_cfa_rdva-premium-parcoursup-notif-formateur",
            },
          })
        )
      )

      await recomputeReferrers({ _id: { $in: eligibleTrainingsForAppointmentsParcoursupFound.map((doc) => doc._id) } })

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
        subject: `Le formulaire de contact La bonne alternance ne sera pas activé pour votre CFA sur Choisir son affectation après la 3e`,
        template: getStaticFilePath("./templates/mail-cfa-premium-refused.mjml.ejs"),
        data: {
          isAffelnet: true,
          images: {
            logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
            logoRf: `${config.publicUrl}/images/emails/logo_rf.png?raw=true`,
          },
          etablissement: {
            name: etablissement.raison_sociale,
            formateur_address: etablissement.formateur_address,
            formateur_zip_code: etablissement.formateur_zip_code,
            formateur_city: etablissement.formateur_city,
            formateur_siret: etablissement.formateur_siret,
          },
          publicEmail: config.publicEmail,
          utmParams: "utm_source=lba&utm_medium=email&utm_campaign=lba_cfa_rdva-affelnet-confirmation-desactivation",
        },
      })

      etablissement = await getDbCollection("etablissements").findOneAndUpdate(
        { _id: etablissement._id },
        {
          $set: { premium_affelnet_refusal_date: new Date() },
        },
        { returnDocument: "after" }
      )

      await clearForcedActivationsAndRecompute({ etablissement_formateur_siret: etablissement!.formateur_siret }, ["AFFELNET"])

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
        subject: `Le formulaire de contact La bonne alternance ne sera pas activé pour votre CFA sur Parcoursup`,
        template: getStaticFilePath("./templates/mail-cfa-premium-refused.mjml.ejs"),
        data: {
          isParcoursup: true,
          images: {
            logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
            logoRf: `${config.publicUrl}/images/emails/logo_rf.png?raw=true`,
          },
          etablissement: {
            name: etablissement.raison_sociale,
            formateur_address: etablissement.formateur_address,
            formateur_zip_code: etablissement.formateur_zip_code,
            formateur_city: etablissement.formateur_city,
            formateur_siret: etablissement.formateur_siret,
          },
          publicEmail: config.publicEmail,
          utmParams: "utm_source=lba&utm_medium=email&utm_campaign=lba_cfa_rdva-parcoursup-confirmation-desactivation",
        },
      })

      etablissement = await getDbCollection("etablissements").findOneAndUpdate(
        { _id: etablissement._id },
        {
          $set: { premium_refusal_date: new Date() },
        },
        { returnDocument: "after" }
      )

      await clearForcedActivationsAndRecompute({ etablissement_formateur_siret: etablissement!.formateur_siret }, ["PARCOURSUP"])

      return res.send(etablissement!)
    }
  )

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
              opt_out_question: sanitizeTextField(req.body.opt_out_question),
            },
            publicEmail: config.publicEmail,
          },
          from: config.transactionalEmail,
        })

        return res.send(etablissement)
      }

      etablissement = await getDbCollection("etablissements").findOneAndUpdate(
        { _id: new ObjectId(req.params.id.toString()) },
        {
          $set: { optout_refusal_date: new Date() },
        },
        { returnDocument: "after" }
      )

      await clearForcedActivationsAndRecompute({ etablissement_formateur_siret: etablissement!.formateur_siret }, ["LBA", "JEUNE_1_SOLUTION", "ONISEP"])

      if (!etablissement!.gestionnaire_email) {
        throw badRequest("Gestionnaire email not found")
      }

      await mailer.sendEmail({
        to: etablissement!.gestionnaire_email,
        subject: "Le formulaire de contact ne sera pas activé pour votre CFA sur La bonne alternance",
        template: getStaticFilePath("./templates/mail-cfa-optout-unsubscription.mjml.ejs"),
        data: {
          images: {
            logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
            logoRf: `${config.publicUrl}/images/emails/logo_rf.png?raw=true`,
          },
          etablissement: {
            name: etablissement!.raison_sociale,
            formateur_address: etablissement!.formateur_address,
            formateur_zip_code: etablissement!.formateur_zip_code,
            formateur_city: etablissement!.formateur_city,
            siret: etablissement!.formateur_siret,
          },
          utmParams: "utm_source=lba&utm_medium=email&utm_campaign=lba_cfa_rdva-optout-confirmation-desinscription",
          publicEmail: config.publicEmail,
        },
      })

      return res.send(etablissement!)
    }
  )
}
