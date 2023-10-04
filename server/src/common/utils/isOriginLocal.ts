import config from "../../config"

/**
 * @description : préciser l'usage de cet utils
 */

const localOrigin = [config.publicUrl]

const localOriginRegexp = /^https:\/\/labonnealternance(.*).apprentissage.beta.gouv.fr(.*)/i
const recetteRegexp = /^https:\/\/labonnealternance-recette.apprentissage.beta.gouv.fr(.*)/i
const prodRegexp = /^https:\/\/labonnealternance.apprentissage.beta.gouv.fr(.*)/i

// test spécifique pour détecter les appels swagger de recette vers prod et prod vers recette qui ne fournissent pas le path dans l'origin (absence /api-docs)
const isCrossEnvironmentRequest = (origin) => {
  return (recetteRegexp.test(origin) && prodRegexp.test(config.publicUrl)) || (prodRegexp.test(origin) && recetteRegexp.test(config.publicUrl))
}

const isOriginLocal = (origin) => {
  if (origin) {
    if (
      (localOriginRegexp.test(origin) || localOrigin.findIndex((element) => origin.toLowerCase().includes(element)) >= 0) &&
      origin.indexOf("api-docs") < 0 &&
      !isCrossEnvironmentRequest(origin)
    ) {
      return true
    } else {
      return false
    }
  } else {
    return false
  }
}

export { isOriginLocal, localOrigin }
