import Joi from "joi"
import { zRoutes } from "shared/index"

import { getStaticFilePath } from "@/common/utils/getStaticFilePath"

import { UserRecruteur } from "../../../common/model/index"
import { createMagicLinkToken, createUserRecruteurToken, createUserToken } from "../../../common/utils/jwtUtils"
import config from "../../../config"
import { CFA, ENTREPRISE, ETAT_UTILISATEUR } from "../../../services/constant.service"
import { sendUserConfirmationEmail } from "../../../services/etablissement.service"
import mailer from "../../../services/mailer.service"
import { getUser, getUserStatus, registerUser } from "../../../services/userRecruteur.service"
import authMiddleware, { authenticationMiddleware } from "../../middlewares/authMiddleware"
import { Server } from "../../server"

export default (server: Server) => {
  server.post(
    "/api/login",
    {
      schema: zRoutes.post["/api/login"],
      preHandler: [authenticationMiddleware("basic")],
    },
    async (req, res) => {
      const user = req.user
      const token = createUserToken(user)
      return res.status(200).send({ token })
    }
  )

  server.post(
    "/api/login/confirmation-email",
    {
      schema: zRoutes.post["/api/login/confirmation-email"],
      preHandler: [],
    },
    async (req, res) => {
      try {
        const { email } = await Joi.object({
          email: Joi.string().email().required(),
        }).validateAsync(req.body, { abortEarly: false })

        const user = await getUser({ email })

        if (!user) {
          return res.status(400).json({ error: true, reason: "UNKNOWN" })
        }

        const { _id, first_name, last_name, is_email_checked } = user

        if (is_email_checked) {
          return res.status(400).json({ error: true, reason: "VERIFIED" })
        }
        await sendUserConfirmationEmail({
          email,
          firstName: first_name,
          lastName: last_name,
          userRecruteurId: _id,
        })
        return res.status(200).send()
      } catch (error) {
        return res.status(400).json({
          errorMessage: "l'adresse mail n'est pas valide.",
          details: error,
        })
      }
    }
  )

  server.post(
    "/api/login/magiclink",
    {
      schema: zRoutes.post["/api/login/magiclink"],
      preHandler: [],
    },
    async (req, res) => {
      const { email } = await Joi.object({
        email: Joi.string().email().required(),
      }).validateAsync(req.body, { abortEarly: false })

      const formatedEmail = email.toLowerCase()
      const user = await UserRecruteur.findOne({ email: formatedEmail })

      if (!user) {
        return res.status(400).json({ error: true, reason: "UNKNOWN" })
      }

      const { email: userEmail, _id, first_name, last_name, is_email_checked } = user || {}

      const status = getUserStatus(user.status)

      if ([ENTREPRISE, CFA].includes(user.type)) {
        if (status && [ETAT_UTILISATEUR.ATTENTE, ETAT_UTILISATEUR.ERROR].includes(status)) {
          return res.status(400).json({ error: true, reason: "VALIDATION" })
        }
        if (status === ETAT_UTILISATEUR.DESACTIVE) {
          return res.status(400).json({
            error: true,
            reason: "DISABLED",
          })
        }
      }

      if (!is_email_checked) {
        await sendUserConfirmationEmail({
          email: userEmail,
          firstName: first_name,
          lastName: last_name,
          userRecruteurId: _id,
        })
        return res.status(400).json({
          error: true,
          reason: "VERIFY",
        })
      }
      const magiclink = `${config.publicUrlEspacePro}/authentification/verification?token=${createMagicLinkToken(userEmail)}`
      await mailer.sendEmail({
        to: userEmail,
        subject: "Lien de connexion",
        template: getStaticFilePath("./templates/mail-connexion.mjml.ejs"),
        data: {
          images: {
            logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
          },
          last_name,
          first_name,
          connexion_url: magiclink,
        },
      })
      return res.status(200).send()
    }
  )

  server.post(
    "/api/login/verification",
    {
      schema: zRoutes.post["/api/login/verification"],
      preHandler: [authenticationMiddleware("jwt-token")],
    },
    async (req, res) => {
      const user = req.user
      await registerUser(user.email)
      return res.status(200).send({ token: createUserRecruteurToken(user) })
    }
  )
}
