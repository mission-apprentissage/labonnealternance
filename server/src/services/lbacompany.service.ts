import { ILbaCompany } from "shared"

import { getElasticInstance } from "../common/esClient/index.js"
import { LbaCompany } from "../common/model/index.js"
import { encryptMailWithIV } from "../common/utils/encryptString.js"
import { manageApiError } from "../common/utils/errorManager.js"
import { roundDistance } from "../common/utils/geolib.js"
import { isAllowedSource } from "../common/utils/isAllowedSource.js"
import { trackApiCall } from "../common/utils/sendTrackingEvent.js"
import { sentryCaptureException } from "../common/utils/sentryUtils.js"

import { getApplicationByCompanyCount, IApplicationCount } from "./application.service.js"
import { TLbaItemResult } from "./jobOpportunity.service.types.js"
import { ILbaItem, LbaItem } from "./lbaitem.shared.service.types.js"

const esClient = getElasticInstance()

/**
 * Adaptation au modèle LBA d'une société issue de l'algo
 * @param {ILbaCompany} company une société issue de l'algo
 * @param {string} caller l'identifiant de l'appelant de l'api
 * @param {boolean} contactAllowedOrigin flag indiquant si les données privées peuvent être retournées
 * @param {IApplicationCount[]} applicationCountByCompany map des nombres de candidatures par sociétés
 * @return {ILbaItem}
 */
const transformCompany = ({
  company,
  caller,
  contactAllowedOrigin,
  applicationCountByCompany,
}: {
  company: ILbaCompany
  caller?: string
  contactAllowedOrigin: boolean
  applicationCountByCompany: IApplicationCount[]
}) => {
  const resultCompany: ILbaItem = new LbaItem("lba")

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
    // @ts-expect-error: TODO
    distance: company.distance?.length ? roundDistance(company.distance[0]) ?? 0 : null,
    fullAddress: address,
    latitude: parseFloat(company.geo_coordinates.split(",")[0]),
    longitude: parseFloat(company.geo_coordinates.split(",")[1]),
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

/**
 * Transformer au format unifié une liste de sociétés issues de l'algo
 * @param {ILbaCompany[]} companies
 * @param {string} referer
 * @param {string} caller
 * @param {IApplicationCount[]} applicationCountByCompany
 * @returns {{ results: LbaItem[]}}
 */
const transformCompanies = ({
  companies = [],
  referer,
  caller,
  applicationCountByCompany,
}: {
  companies: ILbaCompany[]
  referer?: string
  caller?: string
  applicationCountByCompany: IApplicationCount[]
}) => {
  const transformedCompanies: { results: ILbaItem[] } = { results: [] }

  if (companies?.length) {
    transformedCompanies.results = companies.map((company) => {
      const contactAllowedOrigin = isAllowedSource({ referer, caller })
      return transformCompany({
        company,
        contactAllowedOrigin,
        caller,
        applicationCountByCompany,
      })
    })
  }

  return transformedCompanies
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
 * @returns {Promise<ILbaCompany[] | IApiError>}
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
  romes?: string
  latitude?: number
  longitude?: number
  radius?: number
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
          rome_codes: romes?.split(",").join(" "),
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
                geo_coordinates: [longitude ?? 0, latitude ?? 0],
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

    let esQuery: any = {
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
        if (!a || !a.enseigne) {
          return -1
        }
        if (!b || !b.enseigne) {
          return 1
        }
        return a.enseigne.toLowerCase().localeCompare(b.enseigne.toLowerCase())
      })
    }

    return companies
  } catch (error) {
    return manageApiError({ error, api_path: api, caller, errorTitle: `getting lbaCompanies from local ES (${api})` })
  }
}

/**
 * Retourne des sociétés issues de l'algo au format unifié LBA
 * Les sociétés retournées sont celles matchant les critères en paramètres
 */
export const getSomeCompanies = async ({
  romes,
  latitude,
  longitude,
  radius,
  referer,
  caller,
  opco,
  opcoUrl,
  api = "jobV1",
}: {
  romes?: string
  latitude?: number
  longitude?: number
  radius?: number
  referer?: string
  caller?: string
  opco?: string
  opcoUrl?: string
  api?: string
}): Promise<TLbaItemResult> => {
  const hasLocation = latitude === undefined ? false : true
  const currentRadius = hasLocation ? radius : 21000
  const companyLimit = 150 //TODO: query params options or default value from properties -> size || 100

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

  if (!("error" in companies) && companies instanceof Array) {
    const sirets = companies.map(({ siret }) => siret)
    const applicationCountByCompany = await getApplicationByCompanyCount(sirets)
    return transformCompanies({ companies, referer, caller, applicationCountByCompany })
  } else {
    return companies
  }
}

/**
 * Retourne une société issue de l'algo identifiée par sont SIRET
 * @param {string} siret
 * @param {string} referer
 * @param {string} caller
 * @returns {Promise<IApiError | { lbaCompanies: LbaItem[] }>}
 */
export const getCompanyFromSiret = async ({ siret, referer, caller }: { siret: string; referer: string | undefined; caller: string | undefined }) => {
  try {
    const lbaCompany = await LbaCompany.findOne({ siret })

    if (lbaCompany) {
      const applicationCountByCompany = await getApplicationByCompanyCount([lbaCompany.siret])

      const company = transformCompany({
        company: lbaCompany,
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
export const updateContactInfo = async ({ siret, email, phone }: { siret: string; email: string; phone: string }) => {
  try {
    const lbaCompany = await LbaCompany.findOne({ siret })

    if (!lbaCompany) {
      return "not_found"
    } else {
      if (email !== undefined) {
        lbaCompany.email = email
      }

      if (phone !== undefined) {
        lbaCompany.phone = phone
      }

      await lbaCompany.save()

      return lbaCompany
    }
  } catch (err) {
    sentryCaptureException(err)
    throw err
  }
}
