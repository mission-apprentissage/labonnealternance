import Boom from "boom"
import { ILbaCompany } from "shared"

import { LbaCompany } from "../common/model/index"
import { encryptMailWithIV } from "../common/utils/encryptString"
import { IApiError, manageApiError } from "../common/utils/errorManager"
import { roundDistance } from "../common/utils/geolib"
import { isAllowedSource } from "../common/utils/isAllowedSource"
import { trackApiCall } from "../common/utils/sendTrackingEvent"
import { sentryCaptureException } from "../common/utils/sentryUtils"

import { getApplicationByCompanyCount, IApplicationCount } from "./application.service"
import { TLbaItemResult } from "./jobOpportunity.service.types"
import { ILbaItemLbaCompany } from "./lbaitem.shared.service.types"

export const buildLbaCompanyAddress = (company: ILbaCompany) =>
  `${company.street_name ? `${company.street_number ? `${company.street_number} ` : ""}${company.street_name}, ` : ""}${company.zip_code} ${company.city}`.trim()

/**
 * Adaptation au modèle LBA d'une société issue de l'algo
 */
const transformCompany = ({
  company,
  contactAllowedOrigin,
  applicationCountByCompany,
}: {
  company: ILbaCompany
  caller?: string | null
  contactAllowedOrigin: boolean
  applicationCountByCompany: IApplicationCount[]
}): ILbaItemLbaCompany => {
  const contact: {
    email?: string
    iv?: string
    phone?: string | null
  } = encryptMailWithIV({ value: company.email !== "null" ? company.email : "" })

  if (contactAllowedOrigin) {
    contact.phone = company.phone
  }
  // format différent selon accès aux bonnes boîtes par recherche ou par siret
  const address = buildLbaCompanyAddress(company)

  const applicationCount = applicationCountByCompany.find((cmp) => company.siret == cmp._id)

  const resultCompany: ILbaItemLbaCompany = {
    ideaType: "lba",
    title: company.enseigne,
    contact,
    place: {
      distance: company.distance ? roundDistance(company.distance / 1000) ?? 0 : null,
      fullAddress: address,
      latitude: parseFloat(company.geo_coordinates.split(",")[0]),
      longitude: parseFloat(company.geo_coordinates.split(",")[1]),
      city: company.city,
      address,
    },
    company: {
      name: company.enseigne,
      siret: company.siret,
      size: company.company_size,
      url: company.website,
      opco: {
        label: company.opco,
        url: company.opco_url,
      },
    },
    nafs: [
      {
        code: company.naf_code,
        label: company.naf_label,
      },
    ],
    applicationCount: applicationCount?.count || 0,
    url: null,
  }

  return resultCompany
}

/**
 * Transformer au format unifié une liste de sociétés issues de l'algo
 */
const transformCompanies = ({
  companies = [],
  referer,
  caller,
  applicationCountByCompany,
}: {
  companies: ILbaCompany[]
  referer?: string
  caller?: string | null
  applicationCountByCompany: IApplicationCount[]
}): { results: ILbaItemLbaCompany[] } => {
  const transformedCompanies: { results: ILbaItemLbaCompany[] } = { results: [] }

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
 * Retourne des sociétés issues de l'algo matchant les critères en paramètres
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
  caller?: string | null
  opco?: string
  opcoUrl?: string
  api: string
}): Promise<ILbaCompany[] | IApiError> => {
  try {
    const distance = radius || 10

    const query: any = {}

    if (romes) {
      query.rome_codes = { $in: romes?.split(",") }
    }

    if (opco) {
      query.opco_short_name = opco.toUpperCase()
    }

    if (opcoUrl) {
      query.opco_url = opcoUrl.toLowerCase()
    }

    let companies: ILbaCompany[] = []

    if (latitude) {
      companies = await LbaCompany.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [longitude, latitude] },
            distanceField: "distance",
            maxDistance: distance * 1000,
            query,
          },
        },
        {
          $limit: companyLimit,
        },
      ])
    } else {
      companies = await LbaCompany.aggregate([
        {
          $match: query,
        },
        {
          $sample: {
            size: companyLimit,
          },
        },
      ])
    }

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
    return manageApiError({ error, api_path: api, caller, errorTitle: `getting lbaCompanies from DB (${api})` })
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
  caller?: string | null
  opco?: string
  opcoUrl?: string
  api?: string
}): Promise<TLbaItemResult<ILbaItemLbaCompany>> => {
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
 */
export const getCompanyFromSiret = async ({
  siret,
  referer,
  caller,
}: {
  siret: string
  referer: string | undefined
  caller: string | undefined
}): Promise<
  | IApiError
  | {
      lbaCompanies: ILbaItemLbaCompany[]
    }
> => {
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
export const updateContactInfo = async ({ siret, email, phone }: { siret: string; email: string | undefined; phone: string | undefined }) => {
  try {
    const lbaCompany = await LbaCompany.findOne({ siret })

    if (!lbaCompany) {
      throw Boom.badRequest()
    }

    if (email !== undefined) {
      lbaCompany.email = email
    }

    if (phone !== undefined) {
      lbaCompany.phone = phone
    }

    await lbaCompany.save() // obligatoire pour trigger la mise à jour de l'index ES. update ne le fait pas
  } catch (err) {
    sentryCaptureException(err)
    throw err
  }
}
