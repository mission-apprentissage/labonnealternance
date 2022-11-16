import { compose } from "compose-middleware";
import passport from "passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Strategy as LocalStrategy } from "passport-local";
import config from "../../config.js";

export default ({ users }) => {
  passport.use(
    new Strategy(
      {
        jwtFromRequest: ExtractJwt.fromExtractors([
          ExtractJwt.fromUrlQueryParameter("token"),
          ExtractJwt.fromAuthHeaderAsBearerToken(),
        ]),
        secretOrKey: config.auth.user.jwtSecret,
      },
      (jwt_payload, done) => {
        return users
          .getUser(jwt_payload.sub)
          .then((user) => {
            if (!user) {
              return done(null, false);
            }
            return done(null, user);
          })
          .catch((err) => done(err));
      }
    )
  );

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
              return cb(null, false);
            }
            return cb(null, user);
          })
          .catch((err) => cb(err));
      }
    )
  );

  return compose([
    passport.authenticate(["local", "jwt"], { session: false }),
    async (req, res, next) => {
      next();
    },
  ]);
};
