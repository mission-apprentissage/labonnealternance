import axios, { AxiosInstance } from "axios"
import got from "got"
import { sortBy } from "lodash-es"
import querystring from "node:querystring"
import { compose } from "oleoduc"
import { getDistanceInKm } from "../common/utils/geolib.js"
import { logger } from "../common/logger.js"
import { FormationCatalogue, UnsubscribeOF } from "../db/index.js"
import { fetchStream } from "../common/utils/httpUtils.js"
import { streamJsonArray } from "../common/utils/streamUtils.js"
import * as _ from "lodash-es"
import { getElasticInstance } from "../common/esClient/index.js"
import config from "../config.js"
import { sentryCaptureException } from "../common/utils/sentryUtils.js"
import { isValidEmail } from "../common/utils/isValidEmail.js"

export const affelnetSelectedFields = {
  _id: 1,
  email: 1,
  cfd: 1,
  parcoursup_id: 1,
  cle_ministere_educatif: 1,
  etablissement_formateur_siret: 1,
  etablissement_formateur_courriel: 1,
  etablissement_formateur_code_postal: 1,
  intitule_long: 1,
  published: 1,
  adresse: 1,
  localite: 1,
  code_postal: 1,
  lieu_formation_adresse: 1,
  etablissement_formateur_entreprise_raison_sociale: 1,
  etablissement_formateur_adresse: 1,
  etablissement_formateur_nom_departement: 1,
  etablissement_formateur_localite: 1,
  etablissement_gestionnaire_siret: 1,
  etablissement_gestionnaire_courriel: 1,
}

const neededFieldsFromCatalogue = {
  _id: 1,
  published: 1,
  catalogue_published: 1,
  intitule_long: 1,
  intitule_court: 1,
  niveau: 1,
  onisep_url: 1,
  parcoursup_id: 1,
  cle_ministere_educatif: 1,
  diplome: 1,
  cfd: 1,
  rncp_code: 1,
  rncp_intitule: 1,
  rncp_eligible_apprentissage: 1,
  capacite: 1,
  created_at: 1,
  last_update_at: 1,
  id_formation: 1,
  id_rco_formation: 1,
  email: 1,
  lieu_formation_adresse: 1,
  code_postal: 1,
  localite: 1,
  etablissement_formateur_nom_departement: 1,
  etablissement_formateur_courriel: 1,
  etablissement_formateur_adresse: 1,
  etablissement_formateur_complement_adresse: 1,
  etablissement_formateur_localite: 1,
  etablissement_formateur_code_postal: 1,
  etablissement_formateur_cedex: 1,
  etablissement_formateur_siret: 1,
  etablissement_formateur_id: 1,
  etablissement_formateur_uai: 1,
  etablissement_formateur_entreprise_raison_sociale: 1,
  etablissement_formateur_enseigne: 1,
  lieu_formation_geo_coordonnees: 1,
  num_departement: 1,
  region: 1,
  code_commune_insee: 1,
  rome_codes: 1,
  tags: 1,
  etablissement_gestionnaire_courriel: 1,
  etablissement_gestionnaire_adresse: 1,
  etablissement_gestionnaire_complement_adresse: 1,
  etablissement_gestionnaire_localite: 1,
  etablissement_gestionnaire_code_postal: 1,
  etablissement_gestionnaire_cedex: 1,
  etablissement_gestionnaire_entreprise_raison_sociale: 1,
  etablissement_gestionnaire_id: 1,
  etablissement_gestionnaire_uai: 1,
  etablissement_gestionnaire_siret: 1,
  etablissement_gestionnaire_type: 1,
  etablissement_gestionnaire_conventionne: 1,
  affelnet_statut: 1,
  entierement_a_distance: 1,
  contenu: 1,
  objectif: 1,
  date_debut: 1,
  date_fin: 1,
  modalites_entrees_sorties: 1,
  bcn_mefs_10: 1,
}

/**
 * @description Get formation by its identifier.
 * @param {String} id
 * @returns {Promise<Object>}
 */
export const getFormationById = (id: string) => FormationCatalogue.findById(id)

/**
 * @description Get formations by idRcoFormations.
 * @param {String[]} idRcoFormations
 * @returns {Promise<Object[]>}
 */
export const getFormationsByCleMinistereEducatif = ({ cleMinistereEducatifs }: { cleMinistereEducatifs: string[] }) =>
  FormationCatalogue.find({ cle_ministere_educatif: cleMinistereEducatifs })

/**
 * @description Get formations from the formation catalogue collection.
 * @param {Object} query - Mongo query
 * @param {Object} select
 * @returns {Promise<Object>}
 */
export const getCatalogueFormations = (query: object, select?: object) => FormationCatalogue.find(query, select)

/**
 * @description Get formations count through the CARIF OREF catalogue API.
 * @returns {string}
 */
export const countFormations = async (): Promise<number | boolean> => {
  try {
    const response = await axios.get(`${config.catalogueUrl}${config.formationsEndPoint}/count`)
    return response.data
  } catch (error) {
    logger.error(error)
    return false
  }
}

/**
 * @description Returns etablissements.
 * @param {Object} query
 * @returns {Promise<Object[]>}
 */
export const getCatalogueEtablissements = (query: object = {}, select: object = {}): Promise<any> =>
  got(`${config.catalogueUrl}/api/v1/entity/etablissements`, {
    method: "POST",
    json: {
      query,
      select,
      limit: 100000,
    },
  }).json()

/**
 * @description Gets nearest "etablissements" from ROMEs.
 * @param {string[]} rome
 * @param {{latitude: string, longitude: string}} origin
 * @returns {Promise<Object[]>}
 */
export const getNearEtablissementsFromRomes = async ({ rome, origin }: { rome: string; origin: object }) => {
  const formations = await getCatalogueFormations(
    {
      rome_codes: { $in: rome },
      etablissement_gestionnaire_courriel: { $nin: [null, ""] },
      catalogue_published: true,
    },
    {
      etablissement_formateur_id: 1,
      romes: 1,
      geo_coordonnees_etablissement_formateur: 1,
    }
  )

  const etablissementsToRetrieve = new Set()
  formations.map((formation) => etablissementsToRetrieve.add(formation.etablissement_formateur_id))

  const { etablissements } = await getCatalogueEtablissements(
    {
      _id: { $in: Array.from(etablissementsToRetrieve) },
      certifie_qualite: true,
    },
    { _id: 1, numero_voie: 1, type_voie: 1, nom_voie: 1, code_postal: 1, nom_departement: 1, entreprise_raison_sociale: 1, geo_coordonnees: 1 }
  )

  let etablissementsRefined = etablissements.flatMap((etablissement) => {
    // This field can be null
    if (!etablissement.geo_coordonnees) {
      return []
    }

    const [latitude, longitude] = etablissement.geo_coordonnees?.split(",")

    return [
      {
        ...etablissement,
        distance_en_km: getDistanceInKm({ origin, destination: { latitude, longitude } }),
      },
    ]
  })
  etablissementsRefined = sortBy(etablissementsRefined, "distance_en_km")
  const unsubscribedEtablissements = await UnsubscribeOF.find({ catalogue_id: { $in: etablissementsRefined.map((_) => _._id) } })
  const unsubscribedIds = unsubscribedEtablissements.map((_) => _.catalogue_id)
  etablissementsRefined = etablissementsRefined.filter((etablissement) => !unsubscribedIds.includes(etablissement._id))
  return etablissementsRefined
}

/**
 * @description Convert query into URL params
 * @param {Object} query - Mongo query
 * @returns {String}
 */
const convertQueryIntoParams = (query: object, options: object = {}): string => {
  return querystring.stringify({
    query: JSON.stringify(query),
    ...Object.keys(options).reduce((acc, key) => {
      return {
        ...acc,
        [key]: JSON.stringify(options[key]),
      }
    }, {}),
  })
}

/**
 * @description Get all formations through the CARIF OREF catalogue API.
 * @returns {Stream<Object[]>}
 */
export const getAllFormationsFromCatalogue = async () => {
  const now: Date = new Date()
  const tags: number[] = [now.getFullYear(), now.getFullYear() + 1, now.getFullYear() + (now.getMonth() < 8 ? -1 : 2)]

  const count = (await countFormations()) ?? null
  const query = { published: true, catalogue_published: true, tags: { $in: tags.map(String) } }

  if (!count) return

  logger.info(`${count} formation(s) à importer from ${config.catalogueUrl}${config.formationsEndPoint}.json`)

  const streamFormations = async (query, options) => {
    const params = convertQueryIntoParams(query, options)
    const response = await fetchStream(`${config.catalogueUrl}${config.formationsEndPoint}.json?${params}`)

    return compose(response, streamJsonArray())
  }

  return streamFormations(query, {
    limit: count,
    select: neededFieldsFromCatalogue,
  })
}

/**
 * @description create an axios instance to connect to the ministère educatif catalogue
 * @returns {instanceof<API>}
 */
const createCatalogueMeAPI = async (): Promise<AxiosInstance> => {
  const instance = axios.create({ baseURL: "https://catalogue.apprentissage.education.gouv.fr/api/v1" })

  try {
    const response = await axios.post("https://catalogue.apprentissage.education.gouv.fr/api/v1/auth/login", {
      username: config.catalogueMe.username,
      password: config.catalogueMe.password,
    })

    instance.defaults.headers.common["Cookie"] = response.headers["set-cookie"][0]
  } catch (error) {
    logger.error(error.response)
  }

  return instance
}

/**
 * @description: Get formations from the Ministère Educatif formation catalogue
 * @param {Object} query
 * @param {Object} limit
 * @param {Number} page
 * @param {Object} select
 * @param {Array} allFormations
 * @returns {Promise<Object[]>}
 */

// KBA 20221227 : find more elegant solution
let api = null
export const getFormationsFromCatalogueMe = async ({
  query,
  limit,
  page = 1,
  select,
  allFormations = [],
}: {
  query: object
  limit: number
  page?: number
  select?: object
  allFormations?: object[]
}) => {
  if (api === null) {
    api = await createCatalogueMeAPI()
  }

  const params = { page, limit, query: JSON.stringify(query), select: JSON.stringify(select) }

  try {
    const response = await api.get(`/entity/formations`, { params })

    const { formations, pagination } = response.data

    allFormations = allFormations.concat(formations)

    if (page < pagination.nombre_de_page) {
      return getFormationsFromCatalogueMe({ page: page + 1, allFormations, limit, query, select })
    } else {
      return allFormations
    }
  } catch (error) {
    logger.error(error)
  }
}

const esClient = getElasticInstance()

export interface IRomeResult {
  romes?: string[]
  error?: string
  message?: string
}

const getFormationEsQueryIndexFragment = () => {
  return {
    index: "formationcatalogues",
    size: 1000,
    _source_includes: ["rome_codes"],
  }
}

/**
 * @description récupère les romes associés à un cfd de formation ou à un siret d'établissement
 * @param {string} cfd
 * @param {string} siret
 * @returns {Promise<IRomeResult>}
 */
const getRomesFromCatalogue = async ({ cfd, siret }: { cfd?: string; siret?: string }): Promise<IRomeResult> => {
  try {
    const mustTerm = []

    if (cfd) {
      mustTerm.push({
        match: {
          cfd,
        },
      })
    }

    if (siret) {
      mustTerm.push({
        match: {
          etablissement_formateur_siret: siret,
        },
      })
    }

    const esQueryIndexFragment = getFormationEsQueryIndexFragment()

    const responseFormations = await esClient.search({
      ...esQueryIndexFragment,
      body: {
        query: {
          bool: {
            must: mustTerm,
          },
        },
      },
    })

    //throw new Error("BOOM");
    let romes = []

    responseFormations.body.hits.hits.forEach((formation) => {
      romes = romes.concat(formation._source.rome_codes)
    })

    const result: IRomeResult = { romes: romes }

    if (!romes.length) {
      result.error = "No training found"
    }

    return result
  } catch (err) {
    const error_msg = _.get(err, "meta.body", err.message)
    console.error("Error getting trainings from romes ", error_msg)
    if (_.get(err, "meta.meta.connection.status") === "dead") {
      console.error("Elastic search is down or unreachable")
    }
    sentryCaptureException(err)

    return { romes: [], error: error_msg, message: error_msg }
  }
}

/**
 * @description retourne une liste de romes associés à un code cfd à partir des formations du catalogue
 * @param {string} cfd
 * @returns {IRomeResult}
 */
export const getRomesFromCfd = ({ cfd }: { cfd: string }): Promise<IRomeResult> => {
  return getRomesFromCatalogue({ cfd })
}

/**
 * @description retourne une liste de romes associés à un numéro de siret à partir des formations du catalogue
 * @param {string} siret
 * @returns {IRomeResult}
 */
export const getRomesFromSiret = ({ siret }: { siret: string }): Promise<IRomeResult> => {
  return getRomesFromCatalogue({ siret })
}

/**
 * Gets email from catalogue field.
 * These email fields can contain "not valid email", "emails separated by ##" or be null.
 * @param {string|null} email
 * @return {string|null}
 */
export const getEmailFromCatalogueField = (email: null | string) => {
  if (!email) {
    return null
  }

  const divider = "##"
  if (email?.includes(divider)) {
    const emailSplit = email.split(divider).at(-1).toLowerCase()

    return isValidEmail(emailSplit) ? emailSplit : null
  }

  return isValidEmail(email) ? email.toLowerCase() : null
}
