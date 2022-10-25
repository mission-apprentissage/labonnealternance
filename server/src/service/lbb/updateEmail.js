const _ = require("lodash");
const config = require("config");
const Sentry = require("@sentry/node");
const { BonnesBoites } = require("../../common/model");
const Yup = require("yup");

const validationError = "error - validation of data failed";

const validateSiretAndEmail = async (validable) => {
  let schema = Yup.object().shape({
    email: Yup.string().nullable().email("email_format"),
    siret: Yup.string().required("siret_missing"),
  });
  await schema.validate(validable).catch(function () {
    throw validationError;
  });
  return "ok";
};

const updateEmail = async (query) => {
  if (!query.secret) {
    return { error: "secret_missing" };
  } else if (query.secret !== config.private.secretUpdateRomesMetiers) {
    return { error: "wrong_secret" };
  } else {
    try {
      await validateSiretAndEmail({ siret: query.siret, email: query.email });
      let bonneBoite = await BonnesBoites.findOne({ siret: query.siret });
      bonneBoite.email = query.email;

      await bonneBoite.save();

      return bonneBoite;
    } catch (err) {
      if (err === validationError) {
        return { error: "wrong_parameters" };
      } else {
        Sentry.captureException(err);

        let error_msg = _.get(err, "meta.body") ?? err.message;

        return { error: error_msg };
      }
    }
  }
};

module.exports = {
  updateEmail,
};
