import Boom from "boom"
import { removeUrlsFromText } from "shared/helpers/common"
import { toPublicUser, zRoutes } from "shared/index"

import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { userWithAccountToUserForToken } from "@/security/accessTokenService"
import { getUserFromRequest } from "@/security/authenticationService"
import { createAuthMagicLink } from "@/services/appLinks.service"
import { getComputedUserAccess, getGrantedRoles, getPublicUserRecruteurPropsOrError } from "@/services/roleManagement.service"
import { getUserWithAccountByEmail, isUserEmailChecked } from "@/services/userWithAccount.service"

import { startSession, stopSession } from "../../common/utils/session.service"
import config from "../../config"
import { sendUserConfirmationEmail } from "../../services/etablissement.service"
import { controlUserState } from "../../services/login.service"
import mailer, { sanitizeForEmail } from "../../services/mailer.service"
import { updateLastConnectionDate } from "../../services/userRecruteur.service"
import { Server } from "../server"

export default (server: Server) => {
  server.post(
    "/login/:userId/resend-confirmation-email",
    {
      schema: zRoutes.post["/login/:userId/resend-confirmation-email"],
      onRequest: server.auth(zRoutes.post["/login/:userId/resend-confirmation-email"]),
    },
    async (req, res) => {
      const { userId } = req.params
      const user = await getDbCollection("userswithaccounts").findOne({ _id: userId })
      if (!user) {
        return res.status(400).send({ error: true, reason: "UNKNOWN" })
      }
      const is_email_checked = isUserEmailChecked(user)
      if (is_email_checked) {
        return res.status(400).send({ error: true, reason: "VERIFIED" })
      }
      await sendUserConfirmationEmail(user)
      return res.status(200).send({})
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
      const user = await getDbCollection("userswithaccounts").findOne({ email: formatedEmail })

      if (!user) {
        return res.status(400).send({ error: true, reason: "UNKNOWN" })
      }
      const userState = await controlUserState(user)
      if (userState?.error) {
        return res.status(400).send(userState)
      }

      const is_email_checked = isUserEmailChecked(user)
      const { email: userEmail, first_name, last_name } = user

      if (!is_email_checked) {
        await sendUserConfirmationEmail(user)
        return res.status(400).send({
          error: true,
          reason: "VERIFY",
        })
      }

      await mailer.sendEmail({
        to: userEmail,
        subject: "Lien de connexion",
        template: getStaticFilePath("./templates/mail-connexion.mjml.ejs"),
        data: {
          images: {
            logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
          },
          last_name: sanitizeForEmail(removeUrlsFromText(last_name)),
          first_name: sanitizeForEmail(removeUrlsFromText(first_name)),
          connexion_url: createAuthMagicLink(userWithAccountToUserForToken(user)),
        },
      })
      return res.status(200).send({})
    }
  )

  server.post(
    "/login/verification",
    {
      schema: zRoutes.post["/login/verification"],
      onRequest: [server.auth(zRoutes.post["/login/verification"])],
    },
    async (req, res) => {
      const userFromRequest = getUserFromRequest(req, zRoutes.post["/login/verification"]).value
      const { email } = userFromRequest.identity
      const formatedEmail = email.toLowerCase()

      const user = await getUserWithAccountByEmail(formatedEmail)

      if (!user) {
        throw Boom.unauthorized()
      }

      const userState = await controlUserState(user)

      if (userState?.error) {
        throw Boom.forbidden()
      }

      await updateLastConnectionDate(formatedEmail)
      await startSession(email, res)

      return res.status(200).send(toPublicUser(user, await getPublicUserRecruteurPropsOrError(user._id)))
    }
  )

  /**
   * Récupérer l'utilisateur connecté
   */
  server.get(
    "/auth/session",
    {
      schema: zRoutes.get["/auth/session"],
      onRequest: [server.auth(zRoutes.get["/auth/session"])],
    },
    async (request, response) => {
      if (!request.user) {
        throw Boom.forbidden()
      }
      const userFromRequest = getUserFromRequest(request, zRoutes.get["/auth/session"]).value
      return response.status(200).send(toPublicUser(userFromRequest, await getPublicUserRecruteurPropsOrError(userFromRequest._id)))
    }
  )

  server.get(
    "/auth/access",
    {
      schema: zRoutes.get["/auth/access"],
      onRequest: [server.auth(zRoutes.get["/auth/access"])],
    },
    async (request, response) => {
      if (!request.user) {
        throw Boom.forbidden()
      }
      const userFromRequest = getUserFromRequest(request, zRoutes.get["/auth/access"]).value
      const userId = userFromRequest._id.toString()
      const userAccess = getComputedUserAccess(userId, await getGrantedRoles(userId))
      return response.status(200).send(userAccess)
    }
  )

  server.get(
    "/auth/logout",
    {
      schema: zRoutes.get["/auth/logout"],
    },
    async (request, response) => {
      await stopSession(request, response)

      return response.status(200).send({})
    }
  )
}
