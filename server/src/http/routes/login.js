import express from "express";
import Joi from "joi";
import passport from "passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { mailTemplate } from "../../assets/index.js";
import { CFA, ENTREPRISE, etat_utilisateur } from "../../common/constants.js";
import { createMagicLinkToken, createUserToken } from "../../common/utils/jwtUtils.js";
import config from "../../config.js";
import { tryCatch } from "../middlewares/tryCatchMiddleware.js";

const checkToken = (users) => {
  passport.use(
    "jwt",
    new Strategy(
      {
        jwtFromRequest: ExtractJwt.fromBodyField("token"),
        secretOrKey: config.auth.magiclink.jwtSecret,
      },
      (jwt_payload, done) => {
        return users
          .getUser({ email: jwt_payload.sub })
          .then((user) => {
            if (!user) {
              return done(null, false, { message: "User not found" });
            }
            return done(null, user);
          })
          .catch((err) => done(err));
      }
    )
  );

  return passport.authenticate("jwt", { session: false, failWithError: true });
};

export default ({ usersRecruteur, mailer, etablissementsRecruteur }) => {
  const router = express.Router(); // eslint-disable-line new-cap

  router.post(
    "/magiclink",
    tryCatch(async (req, res) => {
      const { email } = await Joi.object({
        email: Joi.string().email().required(),
      }).validateAsync(req.body, { abortEarly: false });

      const user = await usersRecruteur.getUser({ email });

      if (!user) {
        return res.status(400).json({ error: true, reason: "UNKNOWN" });
      }

      const [lastValidationEntry] = user.etat_utilisateur.slice(-1);

      switch (user.type) {
        case CFA:
          if (lastValidationEntry.statut === etat_utilisateur.ATTENTE) {
            return res.status(400).json({ error: true, reason: "VALIDATION" });
          }

          if (lastValidationEntry.statut === etat_utilisateur.DESACTIVE) {
            return res.status(400).json({
              error: true,
              reason: "DISABLED",
            });
          }
          break;
        case ENTREPRISE:
          if (lastValidationEntry.statut === etat_utilisateur.ATTENTE) {
            return res.status(400).json({ error: true, reason: "VALIDATION" });
          }

          if (lastValidationEntry.statut === etat_utilisateur.DESACTIVE) {
            return res.status(400).json({
              error: true,
              reason: "DISABLED",
            });
          }
          break;
      }

      if (user.email_valide === false) {
        let { email, _id, prenom, nom } = user;

        const url = etablissementsRecruteur.getValidationUrl(_id);

        await mailer.sendEmail({
          to: email,
          subject: "La bonne alternance - Confirmez votre adresse email",
          template: mailTemplate["mail-confirmation-email"],
          data: {
            nom,
            prenom,
            confirmation_url: url,
          },
        });

        return res.status(400).json({
          error: true,
          reason: "VERIFY",
        });
      }

      const magiclink = `${config.publicUrl}/authentification/verification?token=${createMagicLinkToken(email)}`;

      await mailer.sendEmail({
        to: user.email,
        subject: "La bonne alternance - Lien de connexion",
        template: mailTemplate["mail-connexion"],
        data: {
          nom: user.nom,
          prenom: user.prenom,
          connexion_url: magiclink,
        },
      });

      return res.sendStatus(200);
    })
  );

  router.post(
    "/verification",
    checkToken(usersRecruteur),
    tryCatch(async (req, res) => {
      const user = req.user;
      await usersRecruteur.registerUser(user.email);
      return res.json({ token: createUserToken(user) });
    })
  );

  return router;
};
