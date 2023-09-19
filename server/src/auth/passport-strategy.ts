import config from "../config.js"
import { getUser as getUserRecruteur } from "../services/userRecruteur.service.js"
import passport from "passport"
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt"
import { Strategy as LocalAPIKeyStrategy } from "passport-localapikey"
import { Strategy as LocalStrategy } from "passport-local"
import { authenticate, getUser } from "../services/user.service.js"
import { sentryCaptureException } from "../common/utils/sentryUtils.js"
import * as userService from "../services/user.service.js"

passport.use("api-key", new LocalAPIKeyStrategy({}, async (token, done) => done(null, config.smtp.brevoWebhookApiKey === token ? { apiKey: token } : false)))

passport.use(
  "basic",
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
    },
    function (username, password, cb) {
      return authenticate(username, password)
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

passport.use(
  "jwt-password",
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromBodyField("passwordToken"),
      secretOrKey: config.auth.password.jwtSecret,
    },
    (jwt_payload, done) => {
      return getUser(jwt_payload.sub)
        .then((user) => {
          if (!user) {
            return done(null, false)
          }
          return done(null, user)
        })
        .catch((err) => done(err))
    }
  )
)

passport.use(
  "jwt-bearer",
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.auth.user.jwtSecret,
    },
    (jwt_payload, done) => {
      return getUserRecruteur({ email: jwt_payload.sub })
        .then((user) => {
          if (!user) {
            return done(null, false)
          }

          return done(null, user)
        })
        .catch((err) => {
          sentryCaptureException(err)
          done(err)
        })
    }
  )
)

passport.use(
  "jwt-token",
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromBodyField("token"),
      secretOrKey: config.auth.magiclink.jwtSecret,
    },
    (jwt_payload, done) => {
      return getUserRecruteur({ email: jwt_payload.sub })
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

passport.use(
  "jwt-rdv",
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromExtractors([ExtractJwt.fromUrlQueryParameter("token"), ExtractJwt.fromAuthHeaderAsBearerToken()]),
      secretOrKey: config.auth.user.jwtSecret,
    },
    (jwt_payload, done) => {
      return userService
        .getUser(jwt_payload.sub)
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
