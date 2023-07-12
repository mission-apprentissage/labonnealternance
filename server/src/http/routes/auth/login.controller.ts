import { compose } from "compose-middleware"
import express from "express"
import Joi from "joi"
import passport from "passport"
import { ExtractJwt, Strategy } from "passport-jwt"
import { Strategy as LocalStrategy } from "passport-local"
import { mailTemplate } from "../../../assets/index.js"
import { CFA, ENTREPRISE, etat_utilisateur } from "../../../common/constants.js"
import { UserRecruteur } from "../../../common/model/index.js"
import { createMagicLinkToken, createUserRecruteurToken, createUserToken } from "../../../common/utils/jwtUtils.js"
import config from "../../../config.js"
import { tryCatch } from "../../middlewares/tryCatchMiddleware.js"
import { IUserRecruteur } from "../../../common/model/schema/userRecruteur/userRecruteur.types.js"
import { getUser, registerUser } from "../../../services/userRecruteur.service.js"
import * as users from "../../../services/user.service.js"
import { getValidationUrl } from "../../../services/etablissement.service.js"

const checkToken = () => {
  passport.use(
    "jwt",
    new Strategy(
      {
        jwtFromRequest: ExtractJwt.fromBodyField("token"),
        secretOrKey: config.auth.magiclink.jwtSecret,
      },
      (jwt_payload, done) => {
        return getUser({ email: jwt_payload.sub })
          .then((user) => {
            if (!user) {
              return done(null, false, { message: "User not found" })
            }
            return done(null, user)
          })
          .catch((err) => done(err))
      }
    )
  )

  return passport.authenticate("jwt", { session: false, failWithError: true })
}

export default ({ mailer }) => {
  const router = express.Router() // eslint-disable-line new-cap
  passport.use(
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password",
      },
      function (username, password, cb) {
        return users
          .authenticate(username, password)
          .then((user) => {
            if (!user) {
              return cb(null, false)
            }
            return cb(null, user)
          })
          .catch((err) => cb(err))
      }
    )
  )

  router.post(
    "/",
    compose([
      passport.authenticate("local", { session: false, failWithError: true }),
      tryCatch(async (req, res) => {
        const user = req.user
        const token = createUserToken(user)
        return res.json({ token })
      }),
    ])
  )

  router.post(
    "/confirmation-email",
    tryCatch(async (req, res) => {
      try {
        const { email } = await Joi.object({
          email: Joi.string().email().required(),
        }).validateAsync(req.body, { abortEarly: false })

        const user: IUserRecruteur = await getUser({ email })

        if (!user) {
          return res.status(400).json({ error: true, reason: "UNKNOWN" })
        }

        const { _id, first_name, last_name, is_email_checked } = user

        if (is_email_checked) {
          return res.status(400).json({ error: true, reason: "VERIFIED" })
        }

        const url = getValidationUrl(_id)

        await mailer.sendEmail({
          to: email,
          subject: "La bonne alternance - Confirmez votre adresse email",
          template: mailTemplate["mail-confirmation-email"],
          data: {
            images: {
              logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
            },
            last_name,
            first_name,
            confirmation_url: url,
          },
        })

        return res.sendStatus(200)
      } catch (error) {
        return res.status(400).json({
          errorMessage: "l'adresse mail n'est pas valide.",
          details: error.details,
        })
      }
    })
  )

  router.post(
    "/magiclink",
    tryCatch(async (req, res) => {
      const { email } = await Joi.object({
        email: Joi.string().email().required(),
      }).validateAsync(req.body, { abortEarly: false })

      const formatedEmail = email.toLowerCase()

      const user = await UserRecruteur.findOne({ email: formatedEmail })
      const { email: userEmail, _id, first_name, last_name, is_email_checked } = user || {}

      if (!user) {
        return res.status(400).json({ error: true, reason: "UNKNOWN" })
      }

      const [lastValidationEntry] = user.status.slice(-1)

      switch (user.type) {
        case CFA:
          if (lastValidationEntry.status === etat_utilisateur.ATTENTE) {
            return res.status(400).json({ error: true, reason: "VALIDATION" })
          }

          if (lastValidationEntry.status === etat_utilisateur.DESACTIVE) {
            return res.status(400).json({
              error: true,
              reason: "DISABLED",
            })
          }
          break
        case ENTREPRISE:
          if (lastValidationEntry.status === etat_utilisateur.ATTENTE) {
            return res.status(400).json({ error: true, reason: "VALIDATION" })
          }

          if (lastValidationEntry.status === etat_utilisateur.DESACTIVE) {
            return res.status(400).json({
              error: true,
              reason: "DISABLED",
            })
          }
          break
      }

      if (!is_email_checked) {
        const url = getValidationUrl(_id)

        await mailer.sendEmail({
          to: userEmail,
          subject: "La bonne alternance - Confirmez votre adresse email",
          template: mailTemplate["mail-confirmation-email"],
          data: {
            images: {
              logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
            },
            last_name,
            first_name,
            confirmation_url: url,
          },
        })

        return res.status(400).json({
          error: true,
          reason: "VERIFY",
        })
      }

      const magiclink = `${config.publicUrlEspacePro}/authentification/verification?token=${createMagicLinkToken(userEmail)}`

      await mailer.sendEmail({
        to: userEmail,
        subject: "La bonne alternance - Lien de connexion",
        template: mailTemplate["mail-connexion"],
        data: {
          images: {
            logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
          },
          last_name,
          first_name,
          connexion_url: magiclink,
        },
      })

      return res.sendStatus(200)
    })
  )

  router.post(
    "/verification",
    checkToken(),
    tryCatch(async (req, res) => {
      const user = req.user
      await registerUser(user.email)
      return res.json({ token: createUserRecruteurToken(user) })
    })
  )

  return router
}
