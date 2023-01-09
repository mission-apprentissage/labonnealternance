import express from "express"
import { mailTemplate } from "../../../assets/index.js"
import { mailType, optMode } from "../../../common/model/constants/etablissement.js"
import { referrers } from "../../../common/model/constants/referrers.js"
import { Etablissement } from "../../../common/model/index.js"
import { dayjs } from "../../../common/utils/dayjs.js"
import { enableAllEtablissementFormations } from "../../../common/utils/optIn.js"
import config from "../../../config.js"
import { tryCatch } from "../../middlewares/tryCatchMiddleware.js"

/**
 * @description Etablissement Router.
 */
export default ({ etablissements, mailer }) => {
  const router = express.Router()

  /**
   * Gets all etablissements
   * */
  router.get(
    "/",
    tryCatch(async (req, res) => {
      let qs = req.query
      const query = qs && qs.query ? JSON.parse(qs.query) : {}
      const page = qs && qs.page ? qs.page : 1
      const limit = qs && qs.limit ? parseInt(qs.limit, 50) : 50

      const allData = await Etablissement.paginate(query, { page, limit })

      return res.send({
        etablissements: allData.docs,
        pagination: {
          page: allData.page,
          resultats_par_page: limit,
          nombre_de_page: allData.pages,
          total: allData.total,
        },
      })
    })
  )

  /**
   * Gets an etablissement from its siret_formateur.
   */
  router.get(
    "/siret-formateur/:siret",
    tryCatch(async ({ params }, res) => {
      const etablissement = await etablissements.findOne({ siret_formateur: params.siret })

      if (!etablissement) {
        return res.sendStatus(404)
      }

      return res.send(etablissement)
    })
  )

  /**
   * Gets an etablissement from its id.
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
   * Creates one or multiple etablissements.
   */
  router.post(
    "/",
    tryCatch(async ({ body }, res) => {
      const { etablissements } = body

      let output
      if (etablissements) {
        output = await Promise.all(etablissements.map((etablissement) => etablissements.create(etablissement)))
      } else {
        output = await etablissements.create(body)
      }

      return res.send(output)
    })
  )

  /**
   * Updates an etablissement.
   */
  router.put(
    "/:id",
    tryCatch(async ({ body, params }, res) => {
      const etablissement = await etablissements.findById(params.id)

      let output
      // Enable all formations that have a catalogue email
      if (etablissement?.opt_mode === null && body?.opt_mode === optMode.OPT_IN) {
        await enableAllEtablissementFormations(
          etablissement.siret_formateur,
          Object.values(referrers).map((referrer) => referrer.code)
        )
        output = await etablissements.findById(params.id)
      } else if (etablissement?.opt_mode === null && body?.opt_mode === optMode.OPT_OUT) {
        const optOutWillBeActivatedAt = body?.opt_out_will_be_activated_at || dayjs().add(15, "days").format()
        const optOutWillBeActivatedAtDayjs = dayjs(optOutWillBeActivatedAt)

        const { messageId } = await mailer.sendEmail({
          to: etablissement.email_decisionnaire,
          subject: `Améliorer le sourcing de vos candidats !`,
          template: mailTemplate["mail-cfa-optout-invitation"],
          data: {
            images: {
              peopleLaptop: `${config.publicUrlEspacePro}/assets/girl_laptop.png?raw=true`,
              optOutLbaIntegrationExample: `${config.publicUrlEspacePro}/assets/exemple_integration_lba.png?raw=true`,
              gouvernementLogo: `${config.publicUrlEspacePro}/assets/gouvernement_logo.png?raw=true`,
            },
            etablissement: {
              name: etablissement.raison_sociale,
              address: etablissement.adresse,
              postalCode: etablissement.code_postal,
              ville: etablissement.localite,
              optOutActivatedAtDate: optOutWillBeActivatedAtDayjs.format("DD/MM"),
              linkToUnsubscribe: `${config.publicUrlEspacePro}/form/opt-out/unsubscribe/${etablissement._id}`,
            },
            user: {
              destinataireEmail: etablissement.email_decisionnaire,
            },
          },
        })

        await Etablissement.updateOne(
          { siret_formateur: etablissement.siret_formateur },
          {
            opt_mode: optMode.OPT_OUT,
            opt_out_invited_at: dayjs().toDate(),
            opt_out_will_be_activated_at: optOutWillBeActivatedAtDayjs.toDate(),
            $push: {
              mailing: {
                campaign: mailType.OPT_OUT_INVITE,
                status: null,
                message_id: messageId,
                email_sent_at: dayjs().toDate(),
              },
            },
          }
        )

        output = await etablissements.findById(params.id)
      } else {
        output = await etablissements.findByIdAndUpdate(params.id, body, { new: true })
      }

      return res.send(output)
    })
  )

  /**
   * Deletes an etablissement.
   */
  router.delete(
    "/:id",
    tryCatch(async ({ params }, res) => {
      await etablissements.findByIdAndDelete(params.id)

      return res.sendStatus(204)
    })
  )

  return router
}
