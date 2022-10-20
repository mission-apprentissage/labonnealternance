import _ from "lodash";
import config from "../config.js";
import updateDiplomesMetiers from "../jobs/diplomesMetiers/updateDiplomesMetiers.js";
import Sentry from "@sentry/node";

const updateDiplomesMetiersQuery = async (query) => {
  if (!query.secret) {
    return { error: "secret_missing" };
  } else if (query.secret !== config.private.secretUpdateRomesMetiers) {
    return { error: "wrong_secret" };
  } else {
    try {
      let result = await updateDiplomesMetiers();
      return result;
    } catch (err) {
      Sentry.captureException(err);

      let error_msg = _.get(err, "meta.body") ?? err.message;

      return { error: error_msg };
    }
  }
};

export {
  updateDiplomesMetiersQuery,
};
