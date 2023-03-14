import _ from "lodash-es"
import { sentryCaptureException } from "../../common/utils/sentryUtils.js"
import config from "../../config.js"
import updateGeoLocationJob from "../../jobs/lbb/updateGeoLocations.js"

const updateGeoLocations = async (query) => {
  if (!query.secret) {
    return { error: "secret_missing" }
  } else if (query.secret !== config.secretUpdateRomesMetiers) {
    return { error: "wrong_secret" }
  } else {
    try {
      const result = await updateGeoLocationJob()
      return result
    } catch (err) {
      sentryCaptureException(err)

      const error_msg = _.get(err, "meta.body") ?? err.message

      return { error: error_msg }
    }
  }
}

export { updateGeoLocations }
