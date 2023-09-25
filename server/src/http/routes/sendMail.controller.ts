import { zRoutes } from "shared/index"

import { sentryCaptureException } from "../../common/utils/sentryUtils"
import config from "../../config"
import { getEmailTemplate } from "../../services/application.service"
import mailer from "../../services/mailer.service"
import { Server } from "../server"

export default function (server: Server) {
  server.get(
    "/api/mail",
    {
      schema: zRoutes.get["/api/mail"],
      config: {
        rateLimit: {
          max: 1,
          timeWindow: "20s",
        },
      },
    },
    async (req, res) => {
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

          res.status(200).send(
            await mailer.sendEmail({
              to: req.query.applicant_email,
              subject: "Envoi mail de test",
              template: getEmailTemplate("mail-candidat"),
              data: mailData,
            })
          )
        } catch (err) {
          sentryCaptureException(err)
          // TODO: Should be 500
          return res.status(200).send({ error: "error_sending_test_mail" })
        }
      }
    }
  )
}
