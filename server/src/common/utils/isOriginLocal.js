import config from "../../config.js"

const localOrigin = [
  "https://labonnealternance.beta.pole-emploi.fr",
  "https://labonnealternance.pole-emploi.fr",
  "https://doctrina.apprentissage.beta.gouv.fr",
  "https://doctrina-recette.apprentissage.beta.gouv.fr",
  "http://localhost:3003",
  "http://localhost:3000",
]

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

export { isOriginLocal }
