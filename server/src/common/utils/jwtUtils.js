import jwt from "jsonwebtoken";
import config from "../../config.js";

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

export { createActivationToken, createPasswordToken, createUserToken };
