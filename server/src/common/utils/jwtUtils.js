import jwt from "jsonwebtoken";
import { pick } from "lodash-es";
import config from "../../config.js";
import { CFA } from "../constants.js";

const createToken = (type, subject, options = {}) => {
  const defaults = config.auth[type];
  const secret = options.secret || defaults.jwtSecret;
  const expiresIn = options.expiresIn || defaults.expiresIn;
  const payload = options.payload || {};

  return jwt.sign(payload, secret, {
    issuer: config.appName,
    expiresIn: expiresIn,
    subject: subject,
  });
};

const createActivationToken = (subject, options = {}) => createToken("activation", subject, options);
const createPasswordToken = (subject, options = {}) => createToken("password", subject, options);
const createUserToken = (user, options = {}) => {
  const payload = { role: user.role };
  return createToken("user", user.username, { payload, ...options });
};

const createUserRecruteurToken = (user, options = {}) => {
  const payload = {
    permissions: pick(user, ["isAdmin"]),
    opco: user.opco,
    scope: user.scope,
    nom: user.nom,
    prenom: user.prenom,
    type: user.type,
    siret: user.siret,
    id_form: user.id_form,
    mandataire: user.type === CFA ? true : false,
    gestionnaire: user.type === CFA ? user.siret : undefined,
    id: user._id,
  };

  return createToken("user", user.email, { payload, ...options });
};

const createMagicLinkToken = (subject, options = {}) => createToken("magiclink", subject, options);

export { createActivationToken, createPasswordToken, createUserToken, createUserRecruteurToken, createMagicLinkToken };
