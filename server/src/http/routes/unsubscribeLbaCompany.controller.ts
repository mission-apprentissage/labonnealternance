import { LbaCompany, UnsubscribedLbaCompany } from "../../common/model/index.js"
import express from "express"
import rateLimit from "express-rate-limit"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"
import { UNSUBSCRIBE_EMAIL_ERRORS } from "../../services/constant.service.js"
import config from "../../config.js"
import path from "path"
import __dirname from "../../common/dirname.js"
import mailer from "../../services/mailer.service.js"
const currentDirname = __dirname(import.meta.url)

const limiter1Per5Second = rateLimit({
  windowMs: 5000, // 5 seconds
  max: 1, // limit each IP to 1 request per windowMs
})

const imagePath = `${config.publicUrl}/images/emails/`

export default function () {
  const router = express.Router()

  router.post(
    "/",
    limiter1Per5Second,
    tryCatch(async (req, res) => {
      let result = "OK"

      const email = req.body.email.toLowerCase()
      const reason = req.body.reason

      const lbaCompaniesToUnsubscribe = await LbaCompany.find({ email }).lean()

      if (!lbaCompaniesToUnsubscribe.length) {
        result = UNSUBSCRIBE_EMAIL_ERRORS["NON_RECONNU"]
      } else if (lbaCompaniesToUnsubscribe.length > 1) {
        result = UNSUBSCRIBE_EMAIL_ERRORS["ETABLISSEMENTS_MULTIPLES"]
      } else {
        const unsubscribedLbaCompany = new UnsubscribedLbaCompany({
          ...lbaCompaniesToUnsubscribe[0],
          unsubscribe_reason: reason,
        })

        unsubscribedLbaCompany.save()

        const lbaCompanyToUnsubscribe = await LbaCompany.findOne({ siret: lbaCompaniesToUnsubscribe[0].siret })
        lbaCompanyToUnsubscribe.remove()

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
      }

      return res.json(result)
    })
  )

  return router
}
