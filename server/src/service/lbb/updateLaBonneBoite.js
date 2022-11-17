import Sentry from "@sentry/node"
import _ from "lodash-es"
import config from "../../config.js"
import updateLaBonneBoiteJob from "../../jobs/lbb/updateLaBonneBoite.js"

const updateLaBonneBoite = async (query) => {
  if (!query.secret) {
    return { error: "secret_missing" }
  } else if (query.secret !== config.secretUpdateRomesMetiers) {
    return { error: "wrong_secret" }
  } else {
    try {
      let params = {
        shouldClearMongo: query?.shouldClearMongo === "false" ? false : true,
        shouldBuildIndex: query?.shouldBuildIndex === "false" ? false : true,
        shouldParseFiles: query?.shouldParseFiles === "false" ? false : true,
        shouldInitSAVEMaps: query?.shouldInitSAVEMaps === "false" ? false : true,
        useCBSPrediction: query?.useCBSPrediction === "true" ? true : false,
      }

      console.log(params)

      let result = await updateLaBonneBoiteJob(params)
      return result
    } catch (err) {
      Sentry.captureException(err)

      let error_msg = _.get(err, "meta.body") ?? err.message

      return { error: error_msg }
    }
  }
}

export { updateLaBonneBoite }
