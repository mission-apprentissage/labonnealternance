import { compose } from "compose-middleware"
import express from "express"
import Joi from "joi"
import passport from "passport"
import { ExtractJwt, Strategy } from "passport-jwt"
import { Strategy as LocalStrategy } from "passport-local"
import { mailTemplate } from "../../../assets/index.js"
import { CFA, ENTREPRISE, etat_utilisateur } from "../../../common/constants.js"
import { createMagicLinkToken, createUserRecruteurToken, createUserToken } from "../../../common/utils/jwtUtils.js"
import config from "../../../config.js"
import { tryCatch } from "../../middlewares/tryCatchMiddleware.js"

const checkToken = (usersRecruteur) => {
  passport.use(
    "jwt",
    new Strategy(
      {
        jwtFromRequest: ExtractJwt.fromBodyField("token"),
        secretOrKey: config.auth.magiclink.jwtSecret,
      },
      (jwt_payload, done) => {
        return usersRecruteur
          .getUser({ email: jwt_payload.sub })
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

export default ({ users, usersRecruteur, etablissementsRecruteur, mailer }) => {
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
        await Joi.object({
          email: Joi.string().email().required(),
        }).validateAsync(req.body, { abortEarly: false })
      } catch (error) {
        return res.status(400).json({
          errorMessage: "Invalid form submission.",
          details: error.details,
        })
      }

      const user = await usersRecruteur.getUser({ email })

      if (!user) {
        return res.status(400).json({ error: true, reason: "UNKNOWN" })
      }

      let { _id, prenom, nom, email, email_valide } = user

      if (email_valide) {
        return res.status(400).json({ error: true, reason: "VERIFIED" })
      }

      const url = etablissementsRecruteur.getValidationUrl(_id)

      await mailer.sendEmail({
        to: email,
        subject: "La bonne alternance - Confirmez votre adresse email",
        template: mailTemplate["mail-confirmation-email"],
        data: {
          nom,
          prenom,
          confirmation_url: url,
        },
      })

      return res.sendStatus(200)
    })
  )

  router.post(
    "/magiclink",
    tryCatch(async (req, res) => {
      const { email } = await Joi.object({
        email: Joi.string().email().required(),
      }).validateAsync(req.body, { abortEarly: false })

      const user = await usersRecruteur.getUser({ email })

      if (!user) {
        return res.status(400).json({ error: true, reason: "UNKNOWN" })
      }

      const [lastValidationEntry] = user.etat_utilisateur.slice(-1)

      switch (user.type) {
        case CFA:
          if (lastValidationEntry.statut === etat_utilisateur.ATTENTE) {
            return res.status(400).json({ error: true, reason: "VALIDATION" })
          }

          if (lastValidationEntry.statut === etat_utilisateur.DESACTIVE) {
            return res.status(400).json({
              error: true,
              reason: "DISABLED",
            })
          }
          break
        case ENTREPRISE:
          if (lastValidationEntry.statut === etat_utilisateur.ATTENTE) {
            return res.status(400).json({ error: true, reason: "VALIDATION" })
          }

          if (lastValidationEntry.statut === etat_utilisateur.DESACTIVE) {
            return res.status(400).json({
              error: true,
              reason: "DISABLED",
            })
          }
          break
      }

      if (user.email_valide === false) {
        let { email, _id, prenom, nom } = user

        const url = etablissementsRecruteur.getValidationUrl(_id)

        await mailer.sendEmail({
          to: email,
          subject: "La bonne alternance - Confirmez votre adresse email",
          template: mailTemplate["mail-confirmation-email"],
          data: {
            nom,
            prenom,
            confirmation_url: url,
          },
        })

        return res.status(400).json({
          error: true,
          reason: "VERIFY",
        })
      }

      const magiclink = `${config.publicUrlEspacePro}/authentification/verification?token=${createMagicLinkToken(email)}`

      await mailer.sendEmail({
        to: user.email,
        subject: "La bonne alternance - Lien de connexion",
        template: mailTemplate["mail-connexion"],
        data: {
          nom: user.nom,
          prenom: user.prenom,
          connexion_url: magiclink,
        },
      })

      return res.sendStatus(200)
    })
  )

  router.post(
    "/verification",
    checkToken(usersRecruteur),
    tryCatch(async (req, res) => {
      const user = req.user
      await usersRecruteur.registerUser(user.email)
      return res.json({ token: createUserRecruteurToken(user) })
    })
  )

  return router
}
