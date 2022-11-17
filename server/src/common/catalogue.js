/* eslint-disable */
// KBA 04/11/2022 :   1:17  error  "got" is not found  node/no-missing-import

import got from "got"
import { sortBy } from "lodash-es"
import { getDistanceInKm } from "../common/geolib.js"
import config from "../config.js"
/**
 * @description Returns wanted page number.
 * @param {number|undefined} responsePage Current page.
 * @param {number|undefined} responseNumberOfPages Number of total pages.
 * @param {number} defaultPage Default starting page.
 * @return {number}
 */
const getPage = ({ responsePage, responseNumberOfPages, defaultPage }) => {
  if (!responsePage) {
    return defaultPage
  }

  if (responsePage < responseNumberOfPages) {
    return responsePage + 1
  }

  return responsePage
}

/**
 * @description Returns etablissements.
 * @param {Object} query
 * @returns {Promise<Object[]>}
 */
export const getCatalogueEtablissements = (query = {}) =>
  got(`${config.catalogueUrl}/api/v1/entity/etablissements`, {
    method: "POST",
    json: {
      query,
      limit: 100000,
    },
  }).json()

/**
 * @description Returns formations.
 * @param {Object} query
 * @param {Object} select
 * @param {Object|undefined} page
 * @returns {Promise<Object[]>}
 */
export const getCatalogueFormations = (query = {}, select = {}, page = undefined) =>
  got(`${config.catalogueUrl}/api/v1/entity/formations`, {
    method: "POST",
    json: {
      query,
      select,
      page,
      limit: 1000,
    },
  }).json()

/**
 * @description Gets nearest "etablissements" from ROMEs.
 * @param {string[]} rome
 * @param {{latitude: string, longitude: string}} origin
 * @returns {Promise<Object[]>}
 */
export const getNearEtablissementsFromRomes = async ({ rome, origin }) => {
  const formations = []
  let dataFormation

  do {
    dataFormation = await getCatalogueFormations(
      {
        rome_codes: { $in: rome },
        etablissement_gestionnaire_courriel: { $nin: [null, ""] },
        catalogue_published: true,
      },
      {
        etablissement_formateur_id: 1,
        romes: 1,
        geo_coordonnees_etablissement_formateur: 1,
      },
      getPage({
        defaultPage: 1,
        responseNumberOfPages: dataFormation?.pagination?.nombre_de_page,
        responsePage: dataFormation?.pagination?.page,
      })
    )

    formations.push(...dataFormation.formations)
  } while (dataFormation.pagination.page !== dataFormation.pagination.nombre_de_page)

  const etablissementsToRetrieve = new Set()
  formations.map((formation) => etablissementsToRetrieve.add(formation.etablissement_formateur_id))

  const { etablissements } = await getCatalogueEtablissements({
    _id: { $in: Array.from(etablissementsToRetrieve) },
    certifie_qualite: true,
  })

  const etablissementsRefined = etablissements
    .map((etablissement) => {
      // This field can be null
      if (!etablissement.geo_coordonnees) {
        return
      }

      const [latitude, longitude] = etablissement.geo_coordonnees?.split(",")

      return {
        ...etablissement,
        distance_en_km: getDistanceInKm({ origin, destination: { latitude, longitude } }),
      }
    })
    .filter(Boolean)

  return sortBy(etablissementsRefined, "distance_en_km")
}
