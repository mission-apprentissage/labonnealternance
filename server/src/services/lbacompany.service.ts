import { getElasticInstance } from "../common/esClient/index.js"
import { encryptMailWithIV } from "../common/utils/encryptString.js"
import { IApiError, manageApiError } from "../common/utils/errorManager.js"
import { isAllowedSource } from "../common/utils/isAllowedSource.js"
import { ILbaCompany } from "../common/model/schema/lbaCompany/lbaCompany.types.js"
import { sentryCaptureException } from "../common/utils/sentryUtils.js"

import { roundDistance } from "../common/utils/geolib.js"
import { lbbMock } from "../mocks/lbbs-mock.js"
import { LbaCompany } from "../common/model/index.js"
import { getApplicationByCompanyCount } from "./application.service.js"
import { trackApiCall } from "../common/utils/sendTrackingEvent.js"
import { LbaItem } from "./lbaitem.shared.service.types.js"
import { ILbaCompanyEsResult } from "./lbacompany.service.types.js"

const esClient = getElasticInstance()

/**
 * Adaptation au modèle LBA
 * @param {PEJob} company une société issue de l'algo
 *
 * @return {ILbaItem}
 */
const transformCompany = ({ company, caller, contactAllowedOrigin, applicationCountByCompany }) => {
  const resultCompany = new LbaItem("lba")

  resultCompany.title = company.enseigne
  const email = encryptMailWithIV({ value: company.email !== "null" ? company.email : "", caller })

  resultCompany.contact = {
    ...email,
  }

  if (contactAllowedOrigin) {
    resultCompany.contact.phone = company.phone
  }

  // format différent selon accès aux bonnes boîtes par recherche ou par siret
  const address = `${company.street_name ? `${company.street_number ? `${company.street_number} ` : ""}${company.street_name}, ` : ""}${company.zip_code} ${company.city}`.trim()

  resultCompany.place = {
    distance: company.distance?.length ? roundDistance(company.distance[0]) ?? 0 : null,
    fullAddress: address,
    latitude: company.geo_coordinates.split(",")[0],
    longitude: company.geo_coordinates.split(",")[1],
    city: company.city,
    address,
  }

  resultCompany.company = {
    name: company.enseigne,
    siret: company.siret,
    size: company.company_size,
    url: company.website,
    opco: {
      label: company.opco,
      url: company.opco_url,
    },
  }

  resultCompany.nafs = [
    {
      code: company.naf_code,
      label: company.naf_label,
    },
  ]

  const applicationCount = applicationCountByCompany.find((cmp) => company.siret == cmp._id)
  resultCompany.applicationCount = applicationCount?.count || 0

  return resultCompany
}

const transformCompanies = ({ companies = [], referer, caller, applicationCountByCompany }) => {
  if (!companies?.length) {
    return { results: [] }
  }
  return {
    results: companies.map((company) => {
      const contactAllowedOrigin = isAllowedSource({ referer, caller })
      return transformCompany({
        company,
        contactAllowedOrigin,
        caller,
        applicationCountByCompany,
      })
    }),
  }
}

export const getSomeCompanies = async ({ romes, latitude, longitude, radius, referer, caller, opco, opcoUrl, api = "jobV1", useMock }) => {
  const hasLocation = latitude === undefined ? false : true
  const currentRadius = hasLocation ? radius : 21000
  const companyLimit = 150 //TODO: query params options or default value from properties -> size || 100

  if (useMock && useMock !== "false") {
    return { results: [lbbMock] }
  } else {
    const companies = await getCompanies({
      romes,
      latitude,
      longitude,
      radius: currentRadius,
      companyLimit,
      caller,
      api,
      opco,
      opcoUrl,
    })
    if (companies && companies.length) {
      const sirets = companies.map(({ siret }) => siret)
      const applicationCountByCompany = await getApplicationByCompanyCount(sirets)
      return transformCompanies({ companies, radius, referer, caller, applicationCountByCompany })
    }
    return companies
  }
}

/**
 * Retourn le bloc de paramètres commun à toutes les recherches ES sur les sociétés issues de l'algo
 * @param {number} limit le nombre maximum de sociétés à remonter
 * @returns {object}
 */
const getCompanyEsQueryIndexFragment = (limit: number) => {
  return {
    //index: "mnaformation",
    index: "bonnesboites",
    size: limit,
    _source_includes: [
      "siret",
      "recruitment_potential",
      "raison_sociale",
      "enseigne",
      "naf_code",
      "naf_label",
      "rome_codes",
      "street_number",
      "street_name",
      "insee_city_code",
      "zip_code",
      "city",
      "geo_coordinates",
      "email",
      "phone",
      "company_size",
      "algorithm_origin",
      "opco",
      "opco_url",
    ],
  }
}

/**
 * Retourne des sociétés issues de l'algo matchant les critères en paramètres
 * @param {string} romes une liste de codes ROME séparés par des virgules
 * @param {string} latitude la latitude du centre de recherche
 * @param {string} longitude la latitude du centre de recherche
 * @param {number} radius le rayon de recherche
 * @param {number} companyLimit le nombre maximum de sociétés à retourner
 * @param {string} caller l'identifiant de l'utilisateur de l'api qui a lancé la recherche
 * @param {string} opco un filtre sur l'opco auquel doivent être rattachés les sociétés
 * @param {string} opcoUrl un filtre sur l'url de l'opco auquel doivent être rattachés les sociétés
 * @param {string} api l'identifiant du endpoint api utilisé pour exploiter cette fonction
 * @returns {Promise<| IApiError>}
 */
const getCompanies = async ({
  romes,
  latitude,
  longitude,
  radius,
  companyLimit,
  caller,
  opco,
  opcoUrl,
  api = "jobV1",
}: {
  romes: string
  latitude: string
  longitude: string
  radius: number
  companyLimit: number
  caller?: string
  opco?: string
  opcoUrl?: string
  api: string
}) => {
  try {
    const distance = radius || 10

    const mustTerm: object[] = [
      {
        match: {
          rome_codes: romes.split(",").join(" "),
        },
      },
    ]

    if (opco) {
      mustTerm.push({
        match: {
          opco_short_name: opco.toUpperCase(),
        },
      })
    }

    if (opcoUrl) {
      mustTerm.push({
        match: {
          opco_url: opcoUrl.toLowerCase(),
        },
      })
    }

    const esQueryIndexFragment = getCompanyEsQueryIndexFragment(companyLimit)

    const esQuerySort = {
      sort: [
        latitude
          ? {
              _geo_distance: {
                geo_coordinates: [parseFloat(longitude), parseFloat(latitude)],
                order: "asc",
                unit: "km",
                mode: "min",
                distance_type: "arc",
                ignore_unmapped: true,
              },
            }
          : "_score",
      ],
    }

    let esQuery: object = {
      query: {
        bool: {
          must: mustTerm,
        },
      },
    }

    if (latitude) {
      esQuery.query.bool.filter = {
        geo_distance: {
          distance: `${distance}km`,
          geo_coordinates: {
            lat: latitude,
            lon: longitude,
          },
        },
      }
    } else {
      esQuery = {
        query: {
          function_score: esQuery,
        },
      }
    }

    const responseCompanies = await esClient.search({
      ...esQueryIndexFragment,
      body: {
        ...esQuery,
        ...esQuerySort,
      },
    })

    const companies: ILbaCompany[] = []

    responseCompanies.body.hits.hits.forEach((company) => {
      companies.push({ ...company._source, distance: latitude ? company.sort : null })
    })

    if (!latitude) {
      companies.sort(function (a, b) {
        return a.enseigne.toLowerCase().localeCompare(b.enseigne.toLowerCase())
      })
    }

    return companies
  } catch (error) {
    return manageApiError({ error, api_path: api, caller, errorTitle: `getting bonnesBoites from local ES (${api})` })
  }
}

/**
 * Retourne une société issue de l'algo identifiée par sont SIRET
 * @param {string} siret
 * @param {string} referer
 * @param {string} caller
 * @returns {Promise<IApiError | { lbaCompanies: LbaItem[] }>}
 */
export const getCompanyFromSiret = async ({ siret, referer, caller }: { siret: string; referer: string; caller: string }) => {
  try {
    const bonneBoite = await LbaCompany.findOne({ siret })

    if (bonneBoite) {
      const applicationCountByCompany = await getApplicationByCompanyCount([bonneBoite.siret])

      const company = transformCompany({
        company: bonneBoite,
        contactAllowedOrigin: isAllowedSource({ referer, caller }),
        caller,
        applicationCountByCompany,
      })

      if (caller) {
        trackApiCall({ caller, api_path: "jobV1/company", job_count: 1, result_count: 1, response: "OK" })
      }

      return { lbaCompanies: [company] }
    } else {
      if (caller) {
        trackApiCall({ caller, api_path: "jobV1/company", job_count: 0, result_count: 0, response: "OK" })
      }

      return { error: "not_found", status: 404, result: "not_found", message: "Société non trouvée" }
    }
  } catch (error) {
    return manageApiError({
      error,
      api_path: "jobV1/company",
      caller,
      errorTitle: "getting company by Siret from local ES",
    })
  }
}

/**
 * Met à jour les coordonnées de contact d'une société issue de l'algo
 * A usage interne
 * @param {string} siret
 * @param {string} email
 * @param {string} phone
 * @returns {Promise<ILbaCompany | string>}
 */
export const updateContactInfo = async ({ siret, email, phone }: { siret: string; email: string; phone: string }): Promise<ILbaCompany | string> => {
  try {
    const bonneBoite = await LbaCompany.findOne({ siret })

    if (!bonneBoite) {
      return "not_found"
    } else {
      if (email !== undefined) {
        bonneBoite.email = email
      }

      if (phone !== undefined) {
        bonneBoite.phone = phone
      }

      await bonneBoite.save()

      return bonneBoite
    }
  } catch (err) {
    sentryCaptureException(err)
    throw err
  }
}
