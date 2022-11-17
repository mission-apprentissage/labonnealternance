import Sentry from "@sentry/node"
import _ from "lodash-es"
import Yup from "yup"
import { BonnesBoites } from "../../common/model/index.js"
import config from "../../config.js"

const validationError = "error - validation of data failed"

const validateSiretAndContactInfo = async (validable) => {
  let schema = Yup.object().shape({
    email: Yup.string().nullable().email("email_format"),
    phone: Yup.number().transform(emptyStringToNull).nullable(),
    siret: Yup.string().required("siret_missing"),
  })
  await schema.validate(validable).catch(function () {
    throw validationError
  })
  return "ok"
}

// helper for yup transform function
function emptyStringToNull(value, originalValue) {
  if (typeof originalValue === "string" && originalValue === "") {
    return null
  }
  return value
}

const updateContactInfo = async (query) => {
  if (!query.secret) {
    return { error: "secret_missing" }
  } else if (query.secret !== config.secretUpdateRomesMetiers) {
    return { error: "wrong_secret" }
  } else {
    try {
      await validateSiretAndContactInfo({ siret: query.siret, email: query.email, phone: query.phone })
      let bonneBoite = await BonnesBoites.findOne({ siret: query.siret })

      if (query.email !== undefined) {
        bonneBoite.email = query.email
      }

      if (query.phone !== undefined) {
        bonneBoite.telephone = query.phone
      }

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

export { updateContactInfo }
