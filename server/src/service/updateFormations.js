import Sentry from "@sentry/node"
import _ from "lodash-es"
import config from "../config.js"
import updateFormations from "../jobs/importFormationsCatalogue/importFormationsCatalogue.js"

const updateFormationsQuery = async (query) => {
  if (!query.secret) {
    return { error: "secret_missing" }
  } else if (query.secret !== config.secretUpdateRomesMetiers) {
    return { error: "wrong_secret" }
  } else {
    try {
      let onlyChangeMasterIndex = query?.onlyChangeMasterIndex ? true : false

      let result = await updateFormations(onlyChangeMasterIndex)
      return result
    } catch (err) {
      Sentry.captureException(err)

      let error_msg = _.get(err, "meta.body") ?? err.message

      return { error: error_msg }
    }
  }
}

export { updateFormationsQuery }
