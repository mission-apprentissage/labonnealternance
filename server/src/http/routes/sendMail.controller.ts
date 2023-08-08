import express from "express"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"
import { sentryCaptureException } from "../../common/utils/sentryUtils.js"
import { getEmailTemplate } from "../../services/application.service.js"
import config from "../../config.js"
import mailer from "../../services/mailer.service.js"

export default function () {
  const router = express.Router()

  router.get(
    "/",
    tryCatch(async (req, res) => {
      if (!req.query.secret) {
        return { error: "secret_missing" }
      } else if (req.query.secret !== config.secretUpdateRomesMetiers) {
        return { error: "wrong_secret" }
      } else {
        try {
          console.log("sending test mail to : ", req.query.email)

          const mailData = {
            user: {
              email: req.query.email,
            },
          }

          res.json(
            await mailer.sendEmail({
              to: req.query.applicant_email,
              subject: "Envoi mail de test",
              template: getEmailTemplate("mail-candidat"),
              data: mailData,
            })
          )
        } catch (err) {
          sentryCaptureException(err)
          return res.json({ error: "error_sending_test_mail" })
        }
      }
    })
  )

  return router
}
