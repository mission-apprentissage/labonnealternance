import Boom from "boom"
import Joi from "joi"
import { toPublicUser, zRoutes } from "shared/index"

import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { ServerBuilder } from "@/http/utils/serverBuilder"
import { createSession, deleteSession } from "@/services/sessions.service"

import { UserRecruteur } from "../../../common/model/index"
import { createMagicLinkToken, createUserToken } from "../../../common/utils/jwtUtils"
import config from "../../../config"
import { CFA, ENTREPRISE, ETAT_UTILISATEUR } from "../../../services/constant.service"
import { sendUserConfirmationEmail } from "../../../services/etablissement.service"
import mailer from "../../../services/mailer.service"
import { getUser, getUserStatus, registerUser } from "../../../services/userRecruteur.service"

export default (server: ServerBuilder) => {
  server.post(
    {
      schema: zRoutes.post["/login/confirmation-email"],
    },
    async (req, res) => {
      try {
        const { email } = await Joi.object({
          email: Joi.string().email().required(),
        }).validateAsync(req.body, { abortEarly: false })

        const user = await getUser({ email })

        if (!user) {
          return res.status(400).send({ error: true, reason: "UNKNOWN" })
        }

        const { _id, first_name, last_name, is_email_checked } = user

        if (is_email_checked) {
          return res.status(400).send({ error: true, reason: "VERIFIED" })
        }
        await sendUserConfirmationEmail({
          email,
          firstName: first_name,
          lastName: last_name,
          userRecruteurId: _id,
        })
        return res.status(200).send({})
      } catch (error) {
        return res.status(400).send({
          errorMessage: "l'adresse mail n'est pas valide.",
          details: error,
        })
      }
    }
  )

  server.post(
    {
      schema: zRoutes.post["/login/magiclink"],
    },
    async (req, res) => {
      const { email } = await Joi.object({
        email: Joi.string().email().required(),
      }).validateAsync(req.body, { abortEarly: false })

      const formatedEmail = email.toLowerCase()
      const user = await UserRecruteur.findOne({ email: formatedEmail })

      if (!user) {
        return res.status(400).send({ error: true, reason: "UNKNOWN" })
      }

      const { email: userEmail, _id, first_name, last_name, is_email_checked } = user || {}

      if (user.status.length) {
        const status = getUserStatus(user.status)

        if ([ENTREPRISE, CFA].includes(user.type)) {
          if ([ETAT_UTILISATEUR.ATTENTE, ETAT_UTILISATEUR.ERROR].includes(status)) {
            return res.status(400).send({ error: true, reason: "VALIDATION" })
          }
          if (status === ETAT_UTILISATEUR.DESACTIVE) {
            return res.status(400).send({
              error: true,
              reason: "DISABLED",
            })
          }
        }
      }

      if (!is_email_checked) {
        await sendUserConfirmationEmail({
          email: userEmail,
          firstName: first_name,
          lastName: last_name,
          userRecruteurId: _id,
        })
        return res.status(400).send({
          error: true,
          reason: "VERIFY",
        })
      }
      const magiclink = `${config.publicUrl}/espace-pro/authentification/verification?token=${createMagicLinkToken(userEmail)}`
      await mailer.sendEmail({
        to: userEmail,
        subject: "Lien de connexion",
        template: getStaticFilePath("./templates/mail-connexion.mjml.ejs"),
        data: {
          images: {
            logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
          },
          last_name,
          first_name,
          connexion_url: magiclink,
        },
      })
      return res.status(200).send({})
    }
  )

  server.post(
    {
      schema: zRoutes.post["/login/verification"],
    },
    async (req, res, user) => {
      const token = createUserToken({ email: user.email }, { payload: { email: user.email } })
      await createSession({ token })

      const connectedUser = await registerUser(user.email)

      if (!connectedUser) {
        throw Boom.forbidden()
      }

      return res.setCookie(config.auth.session.cookieName, token, config.auth.session.cookie).status(200).send(toPublicUser(connectedUser))
    }
  )

  /**
   * Récupérer l'utilisateur connecté
   */
  server.get(
    {
      schema: zRoutes.get["/auth/session"],
    },
    async (request, response, user) => {
      return response.status(200).send(toPublicUser(user))
    }
  )

  server.get(
    {
      schema: zRoutes.get["/auth/logout"],
    },
    async (request, response) => {
      const token = request.cookies[config.auth.session.cookieName]

      if (token) {
        await deleteSession(token)

        return response.clearCookie(config.auth.session.cookieName, config.auth.session.cookie).status(200).send({})
      }

      return response.status(200).send({})
    }
  )
}
