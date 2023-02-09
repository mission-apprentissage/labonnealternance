import Sentry from "@sentry/node"
import _ from "lodash-es"
import Yup from "yup"
import { BonnesBoites } from "../../common/model/index.js"
import config from "../../config.js"

const validationError = "error - validation of data failed"

const validateSiretAndEmail = async (validable) => {
  let schema = Yup.object().shape({
    email: Yup.string().nullable().email("email_format"),
    siret: Yup.string().required("siret_missing"),
  })
  await schema.validate(validable).catch(function () {
    throw validationError
  })
  return "ok"
}

const updateEmail = async (query) => {
  if (!query.secret) {
    return { error: "secret_missing" }
  } else if (query.secret !== config.secretUpdateRomesMetiers) {
    return { error: "wrong_secret" }
  } else {
    try {
      await validateSiretAndEmail({ siret: query.siret, email: query.email })
      let bonneBoite = await BonnesBoites.findOne({ siret: query.siret })
      bonneBoite.email = query.email

      await bonneBoite.save()

      return bonneBoite
    } catch (err) {
      if (err === validationError) {
        return { error: "wrong_parameters" }
      } else {
        Sentry.captureException(err)

        let error_msg = _.get(err, "meta.body") ?? err.message

        return { error: error_msg }
      }
    }
  }
}

export { updateEmail }
