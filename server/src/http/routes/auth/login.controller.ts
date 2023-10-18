import Boom from "boom"
import { toPublicUser, zRoutes } from "shared/index"

import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getUserFromRequest } from "@/http/middlewares/authMiddleware"
import { createSession, deleteSession } from "@/services/sessions.service"

import { createMagicLinkToken, createUserToken } from "../../../common/utils/jwtUtils"
import config from "../../../config"
import { CFA, ENTREPRISE, ETAT_UTILISATEUR } from "../../../services/constant.service"
import { sendUserConfirmationEmail } from "../../../services/etablissement.service"
import mailer from "../../../services/mailer.service"
import { getUser, getUserStatus, registerUser } from "../../../services/userRecruteur.service"
import { Server } from "../../server"

export default (server: Server) => {
  server.post(
    "/login/confirmation-email",
    {
      schema: zRoutes.post["/login/confirmation-email"],
      preHandler: [],
    },
    async (req, res) => {
      try {
        const { email } = req.body
        const formatedEmail = email.toLowerCase()
        const user = await getUser({ email: formatedEmail })

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
    "/login/magiclink",
    {
      schema: zRoutes.post["/login/magiclink"],
    },
    async (req, res) => {
      const { email } = req.body
      const formatedEmail = email.toLowerCase()
      const user = await getUser({ email: formatedEmail })

      if (!user) {
        return res.status(400).send({ error: true, reason: "UNKNOWN" })
      }

      const { email: userEmail, _id, first_name, last_name, is_email_checked } = user || {}

      if (user.status?.length) {
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
    "/login/verification",
    {
      schema: zRoutes.post["/login/verification"],
      onRequest: [server.auth(zRoutes.post["/login/verification"].securityScheme)],
    },
    async (req, res) => {
      const user = getUserFromRequest(req, zRoutes.post["/login/verification"])

      const token = createUserToken({ email: user.email }, { payload: { email: user.email } })
      await createSession({ token })

      const formatedEmail = user.email.toLowerCase()
      const connectedUser = await registerUser(formatedEmail)

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
    "/auth/session",
    {
      schema: zRoutes.get["/auth/session"],
      onRequest: [server.auth(zRoutes.get["/auth/session"].securityScheme)],
    },
    async (request, response) => {
      if (!request.user) {
        throw Boom.forbidden()
      }
      const user = getUserFromRequest(request, zRoutes.get["/auth/session"])
      return response.status(200).send(toPublicUser(user))
    }
  )

  server.get(
    "/auth/logout",
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
