import axios from "axios"
import dayjs from "dayjs"
import config from "../../config.js"

const accessTokenEndpoint = "https://entreprise.pole-emploi.fr/connexion/oauth2/access_token?realm=%2Fpartenaire"
const contentType = "application/x-www-form-urlencoded"

const headers = { headers: { "Content-Type": contentType }, timeout: 3000 }

const clientId = config.esdClientId === "1234" ? process.env.ESD_CLIENT_ID : config.esdClientId
const clientSecret = config.esdClientSecret === "1234" ? process.env.ESD_CLIENT_SECRET : config.esdClientSecret

const scopeApisPE = `application_${clientId}%20`

const scopeLBB = "api_labonneboitev1"
const scopeLBA = "api_labonnealternancev1"
const scopePE = "api_offresdemploiv2%20o2dsoffre"

const paramApisPE = `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}&scope=${scopeApisPE}`
const paramLBB = `${paramApisPE}${scopeLBB}`
const paramLBA = `${paramApisPE}${scopeLBA}`
const paramPE = `${paramApisPE}${scopePE}`

const peApiHeaders = { "Content-Type": "application/json", Accept: "application/json" }

let tokens = {
  lbb: null,
  pe: null,
}

const getAccessTokenFromQuery = async (query) => {
  if (!query.api) return "api_is_missing"
  else if (query.api !== "lbb" && query.api !== "pe") return "unknown_api"

  try {
    const response = await axios.post(accessTokenEndpoint, query.api === "lbb" ? paramLBB : paramPE, headers)

    if (response.data) {
      return response.data.access_token
    } else return "no_result"
  } catch (error) {
    console.log(error)
    return "error"
  }
}

// retourne un refresh token encore valide ou null à défaut
const getCurrentToken = (api) => {
  const token = tokens[api]
  const now = dayjs()

  if (token && token.expiry.isAfter(now)) {
    return token.value
  } else {
    return null
  }
}

// fixe un refresh token d'une durée de <25 minutes (1490 secondes)
const setCurrentToken = async (api, token, expiresIn) => {
  tokens[api] = {
    value: token,
    expiry: dayjs().add(expiresIn - 10, "s"),
  }
}

// récupère un token d'accès aux API de Pôle emploi
const getAccessToken = async (api) => {
  try {
    if (!api) return "api_is_missing"
    else if (api !== "lba" && api !== "lbb" && api !== "pe") return "unknown_api"

    //console.log("accessToken : ", api, accessTokenEndpoint, paramLBB);

    const currentToken = getCurrentToken(api)

    if (currentToken) return currentToken
    else {
      let paramApi = api === "lbb" ? paramLBB : api === "lba" ? paramLBA : paramPE
      const response = await axios.post(accessTokenEndpoint, paramApi, headers)

      if (response.data) {
        setCurrentToken(api, response.data.access_token, response.data.expires_in)
        return response.data.access_token
      } else return "no_result"
    }
  } catch (error) {
    console.log(error)
    return "error"
  }
}

const peJobApiEndpointReferentiel = "https://api.emploi-store.fr/partenaire/offresdemploi/v2/referentiel/"
// liste des référentiels disponible sur https://www.emploi-store-dev.fr/portail-developpeur-cms/home/catalogue-des-api/documentation-des-api/api/api-offres-demploi-v2/referentiels.html
// sous /server pour bénéficier du dossier /config
// clear & node -e 'require("./src/service/poleEmploi/common").getPeApiReferentiels("themes")'
const getPeApiReferentiels = async (referentiel) => {
  try {
    const token = await getAccessToken("pe")
    let headers = peApiHeaders
    headers.Authorization = `Bearer ${token}`

    const referentiels = await axios.get(`${peJobApiEndpointReferentiel}${referentiel}`, {
      headers,
    })

    console.log(`Référentiel ${referentiel} :`, referentiels) // retour car utilisation en mode CLI uniquement
  } catch (error) {
    console.log("error getReferentiel ", error)
  }
}

// formule de modification du rayon de distance pour prendre en compte les limites des communes
const getRoundedRadius = (radius) => {
  return radius * 1.2
}

export { getAccessToken, getAccessTokenFromQuery, getPeApiReferentiels, peApiHeaders, getRoundedRadius }
