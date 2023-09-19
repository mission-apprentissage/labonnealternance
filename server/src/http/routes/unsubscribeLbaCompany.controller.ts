import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import express from "express"
import rateLimit from "express-rate-limit"
import { LbaCompany, UnsubscribedLbaCompany } from "../../common/model/index.js"
import config from "../../config"
import { UNSUBSCRIBE_EMAIL_ERRORS } from "../../services/constant.service"
import mailer from "../../services/mailer.service"
import { tryCatch } from "../middlewares/tryCatchMiddleware"

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
          template: getStaticFilePath("./templates/mail-desinscription-algo.mjml.ejs"),
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
