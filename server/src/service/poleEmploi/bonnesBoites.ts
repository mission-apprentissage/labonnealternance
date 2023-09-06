// @ts-nocheck
import { getElasticInstance } from "../../common/esClient/index"
import { BonnesBoites } from "../../common/model/index"
import { encryptMailWithIV } from "../../common/utils/encryptString"
import { IApiError, manageApiError } from "../../common/utils/errorManager"
import { roundDistance } from "../../common/utils/geolib"
import { isAllowedSource } from "../../common/utils/isAllowedSource"
import { trackApiCall } from "../../common/utils/sendTrackingEvent"
import { lbbMock } from "../../mocks/lbbs-mock"
import { itemModel } from "../../model/itemModel"
import { getApplicationByCompanyCount } from "../../services/application.service"

const esClient = getElasticInstance()

const getSomeLbbCompanies = async ({ romes, latitude, longitude, radius, type, referer, caller, opco, opcoUrl, api = "jobV1", useMock }) => {
  const hasLocation = latitude === undefined ? false : true
  const currentRadius = hasLocation ? radius : 21000
  const companyLimit = 150 //TODO: query params options or default value from properties -> size || 100

  if (useMock && useMock !== "false") {
    return { results: [lbbMock] }
  } else {
    const companies = await getLbbCompanies({
      romes,
      latitude,
      longitude,
      radius: currentRadius,
      companyLimit,
      type,
      caller,
      api,
      opco,
      opcoUrl,
    })
    if (companies && companies.length) {
      const sirets = companies.map(({ siret }) => siret)
      const applicationCountByCompany = await getApplicationByCompanyCount(sirets)
      return transformLbbCompaniesForIdea({ companies, radius, type, referer, caller, applicationCountByCompany })
    }
    return companies
  }
}

const transformLbbCompaniesForIdea = ({ companies = [], type, referer, caller, applicationCountByCompany }) => {
  if (!companies?.length) {
    return { results: [] }
  }
  return {
    results: companies.map((company) => {
      const contactAllowedOrigin = isAllowedSource({ referer, caller })
      return transformLbbCompanyForIdea({
        company,
        type,
        contactAllowedOrigin,
        caller,
        applicationCountByCompany,
      })
    }),
  }
}

// Adaptation au modèle Idea et conservation des seules infos utilisées des offres
const transformLbbCompanyForIdea = ({ company, type, caller, contactAllowedOrigin, applicationCountByCompany }) => {
  const resultCompany = itemModel(type)

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
    //socialNetwork: company.social_network,
    url: company.website,
    opco: {
      label: company.opco,
      url: company.opco_url,
    },
  }

  //resultCompany.url = company.url;

  /*resultCompany.romes = [
    {
      code: company.matched_rome_code,
      label: company.matched_rome_label,
    },
  ];*/

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

const getLbbCompanies = async ({ romes, latitude, longitude, radius, companyLimit, type, caller, opco, opcoUrl, api = "jobV1" }) => {
  try {
    const distance = radius || 10

    const mustTerm = [
      {
        match: {
          rome_codes: romes.split(",").join(" "),
        },
      },
      {
        match: {
          algorithm_origin: type,
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

    const esQueryIndexFragment = getBonnesBoitesEsQueryIndexFragment(companyLimit)

    const esQuerySort = {
      sort: [
        latitude || latitude === 0
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

    let esQuery = {
      query: {
        bool: {
          must: mustTerm,
        },
      },
    }

    if (latitude || latitude === 0) {
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

    const responseBonnesBoites = await esClient.search({
      ...esQueryIndexFragment,
      body: {
        ...esQuery,
        ...esQuerySort,
      },
    })

    const bonnesBoites = []

    responseBonnesBoites.body.hits.hits.forEach((bonneBoite) => {
      bonnesBoites.push({ ...bonneBoite._source, distance: latitude || latitude === 0 ? bonneBoite.sort : null })
    })

    if (!latitude && latitude !== 0) {
      bonnesBoites.sort(function (a, b) {
        return a.enseigne.toLowerCase().localeCompare(b.enseigne.toLowerCase())
      })
    }

    return bonnesBoites
  } catch (error) {
    return manageApiError({ error, api_path: api, caller, errorTitle: `getting bonnesBoites from local ES (${api})` })
  }
}

const getCompanyFromSiret = async ({ siret, referer, caller, type }): IApiError | { lbbCompanies: ILbaItem[] } | { lbaCompanies: ILbaItem[] } => {
  try {
    const bonneBoite = await BonnesBoites.findOne({ siret })

    if (bonneBoite) {
      const applicationCountByCompany = await getApplicationByCompanyCount([bonneBoite.siret])

      const company = transformLbbCompanyForIdea({
        company: bonneBoite,
        type,
        contactAllowedOrigin: isAllowedSource({ referer, caller }),
        caller,
        applicationCountByCompany,
      })

      if (caller) {
        trackApiCall({ caller, api_path: "jobV1/company", job_count: 1, result_count: 1, response: "OK" })
      }

      return type === "lbb" ? { lbbCompanies: [company] } : { lbaCompanies: [company] }
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

const getBonnesBoitesEsQueryIndexFragment = (limit) => {
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

export { getSomeLbbCompanies, getCompanyFromSiret }
