import querystring from "node:querystring"

import { notFound } from "@hapi/boom"
import axios, { AxiosInstance } from "axios"
import { got } from "got"
import { sortBy } from "lodash-es"
import { ObjectId } from "mongodb"
import { compose } from "oleoduc"
import { IEtablissementCatalogue, IEtablissementCatalogueProche, IEtablissementCatalogueProcheWithDistance } from "shared/interface/etablissement.types"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"

import { logger } from "../common/logger"
import { getDistanceInKm } from "../common/utils/geolib"
import { fetchStream } from "../common/utils/httpUtils"
import { isValidEmail } from "../common/utils/isValidEmail"
import { streamJsonArray } from "../common/utils/streamUtils"
import config from "../config"

const DISTANCE_MAX_CFA_PROCHE = 100

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
  intitule_rco: 1,
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
  num_tel: 1,
}

/**
 * @description Get formation by its identifier.
 * @param {String} id
 * @returns {Promise<Object>}
 */
export const getFormationById = (id: string) => getDbCollection("formationcatalogues").findOne({ _id: new ObjectId(id) })

/**
 * @description Get formations from the formation catalogue collection.
 * @param {Object} query - Mongo query
 * @param {Object} select
 * @returns {Promise<Object>}
 */
export const getCatalogueFormations = (query: object, select?: object) => getDbCollection("formationcatalogues").find(query, select).toArray()

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
export const getCatalogueEtablissements = (query: object = {}, select: object = {}): Promise<{ etablissements: IEtablissementCatalogue[] }> =>
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
export const getNearEtablissementsFromRomes = async ({ rome, origin, limit }: { rome: string[]; origin: { latitude: number; longitude: number }; limit: number }) => {
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
  formations.forEach((formation) => etablissementsToRetrieve.add(formation.etablissement_formateur_id))

  const { etablissements }: { etablissements: IEtablissementCatalogueProche[] } = await getCatalogueEtablissements(
    {
      _id: { $in: Array.from(etablissementsToRetrieve) },
      certifie_qualite: true,
    },
    { _id: 1, siret: 1, numero_voie: 1, type_voie: 1, nom_voie: 1, code_postal: 1, nom_departement: 1, entreprise_raison_sociale: 1, geo_coordonnees: 1 }
  )

  let etablissementsRefined = etablissements.flatMap((etablissement) => {
    // This field can be null
    if (!etablissement.geo_coordonnees) {
      return []
    }

    // eslint-disable-next-line no-unsafe-optional-chaining
    const [latitude, longitude] = etablissement.geo_coordonnees?.split(",")

    const distance_en_km = getDistanceInKm({ origin, destination: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) } })

    if (distance_en_km > DISTANCE_MAX_CFA_PROCHE) {
      return []
    }

    return [
      {
        ...etablissement,
        distance_en_km,
      },
    ] as IEtablissementCatalogueProcheWithDistance[]
  })
  etablissementsRefined = sortBy(etablissementsRefined, "distance_en_km")
  const unsubscribedEtablissements = await getDbCollection("unsubscribedofs")
    .find({ catalogue_id: { $in: etablissementsRefined.map((etablissement) => etablissement._id) } })
    .toArray()
  const unsubscribedIds = unsubscribedEtablissements.map((unsubscribeOF) => unsubscribeOF.catalogue_id)
  etablissementsRefined = etablissementsRefined.filter((etablissement) => !unsubscribedIds.includes(etablissement._id))
  return etablissementsRefined.slice(0, limit)
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
  const instance = axios.create({ baseURL: "https://catalogue.apprentissage.education.gouv.fr/api" })

  try {
    const response = await instance.post("/v1/auth/login", {
      username: config.catalogueMe.username,
      password: config.catalogueMe.password,
    })

    instance.defaults.headers.common["Cookie"] = response?.headers["set-cookie"]?.[0]
  } catch (error: any) {
    sentryCaptureException(error)
  }

  return instance
}

export const getParcoursupAndAffelnetPerimetreFromCatalogueME = async (): Promise<
  | Array<{
      cle_ministere_educatif: string
      parcoursup_perimetre_prise_rdv: boolean
      affelnet_perimetre_prise_rdv: boolean
      parcoursup_id: string
    }>
  | undefined
> => {
  const api = await createCatalogueMeAPI()

  try {
    const response = await api.get(`/perimetre-prise-rdv.json`)
    return response.data
  } catch (error: any) {
    sentryCaptureException(error)
  }
}

export const getRomesFromCatalogue = async ({
  cfd,
  siret,
}: {
  cfd?: string
  siret?: string
}): Promise<{
  romes: string[]
}> => {
  const query: { cfd?: string; etablissement_formateur_siret?: string } = {}

  if (cfd) query.cfd = cfd
  if (siret) query.etablissement_formateur_siret = siret

  const formationsFromDb = await getDbCollection("formationcatalogues").find(query)

  const romes: Set<string> = new Set()

  formationsFromDb.forEach((formation) => {
    if (formation.rome_codes) {
      formation.rome_codes.forEach((rome) => romes.add(rome))
    }
  })

  const result = { romes: [...romes] }

  if (!result.romes.length) {
    throw notFound("No training found")
  }
  return result
}

export const getEmailFromCatalogueField = (email: string | null | undefined) => {
  if (!email) {
    return null
  }

  return isValidEmail(email) ? email.toLowerCase() : null
}
