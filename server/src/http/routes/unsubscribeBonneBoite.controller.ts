import { BonnesBoites, UnsubscribedBonneBoite } from "../../common/model/index.js"
import express from "express"
import rateLimit from "express-rate-limit"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"
import { UNSUBSCRIBE_EMAIL_ERRORS } from "../../services/constants.js"
import config from "../../config.js"
import path from "path"
import __dirname from "../../common/dirname.js"
import { notifyToSlack } from "../../common/utils/slackUtils.js"
const currentDirname = __dirname(import.meta.url)

const limiter1Per5Second = rateLimit({
  windowMs: 5000, // 5 seconds
  max: 1, // limit each IP to 1 request per windowMs
})

const imagePath = `${config.publicUrl}/images/emails/`

export default function ({ mailer }) {
  const router = express.Router()

  router.post(
    "/",
    limiter1Per5Second,
    tryCatch(async (req, res) => {
      let result = "OK"

      const email = req.body.email.toLowerCase()
      const reason = req.body.reason

      const bonnesBoitesToUnsubscribe = await BonnesBoites.find({ email }).lean()

      if (!bonnesBoitesToUnsubscribe.length) {
        result = UNSUBSCRIBE_EMAIL_ERRORS["NON_RECONNU"]
      } else if (bonnesBoitesToUnsubscribe.length > 1) {
        result = UNSUBSCRIBE_EMAIL_ERRORS["ETABLISSEMENTS_MULTIPLES"]
      } else {
        const unsubscribedBonneBoite = new UnsubscribedBonneBoite({
          ...bonnesBoitesToUnsubscribe[0],
          unsubscribe_reason: reason,
        })

        unsubscribedBonneBoite.save()

        const bonneBoiteToUnsubscribe = await BonnesBoites.findOne({ siret: bonnesBoitesToUnsubscribe[0].siret })
        bonneBoiteToUnsubscribe.remove()

        await mailer.sendEmail({
          to: email,
          subject: `Confirmation de déréférencement du service La bonne alternance`,
          template: path.join(currentDirname, `../../assets/templates/mail-desinscription-algo.mjml.ejs`),
          data: {
            images: {
              logoLba: `${imagePath}logo_LBA.png`,
              logoRF: `${imagePath}logo_rf.png`,
            },
          },
        })

        // await notifyToSlack({
        //   subject: "Désinscription société issue de l'algo",
        //   message: `La société avec le siret ${bonnesBoitesToUnsubscribe[0].siret} a été désinscrite des sociétés issues de l'algo`,
        //   error: false,
        // })
      }

      return res.json(result)
    })
  )

  return router
}
