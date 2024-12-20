import { badRequest, internal, notFound } from "@hapi/boom"
import { Document, Filter, ObjectId } from "mongodb"
import { ERecruteurLbaUpdateEventType, IApplication, ILbaCompany, ILbaCompanyForContactUpdate, IRecruteurLbaUpdateEvent } from "shared"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { encryptMailWithIV } from "../common/utils/encryptString"
import { IApiError, manageApiError } from "../common/utils/errorManager"
import { roundDistance } from "../common/utils/geolib"
import { isAllowedSource } from "../common/utils/isAllowedSource"
import { getDbCollection } from "../common/utils/mongodbUtils"
import { trackApiCall } from "../common/utils/sendTrackingEvent"
import { sentryCaptureException } from "../common/utils/sentryUtils"

import { getApplicationByCompanyCount, IApplicationCount } from "./application.service"
import { generateApplicationToken } from "./appLinks.service"
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
    ideaType: LBA_ITEM_TYPE_OLD.LBA,
    // ideaType: LBA_ITEM_TYPE.RECRUTEURS_LBA,
    id: company.siret,
    title: company.enseigne,
    contact,
    place: {
      distance: company.distance ? (roundDistance(company.distance / 1000) ?? 0) : null,
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
    token: generateApplicationToken({ company_siret: company.siret }),
    recipient_id: `recruteurslba_${company._id.toString()}`,
  }

  return resultCompany
}

/**
 * Adaptation au modèle LBA d'une société issue de l'algo avec les données minimales nécessaires pour l'ui LBA
 */
const transformCompanyWithMinimalData = ({ company, applicationCountByCompany }: { company: ILbaCompany; applicationCountByCompany: IApplicationCount[] }): ILbaItemLbaCompany => {
  // format différent selon accès aux bonnes boîtes par recherche ou par siret
  const address = buildLbaCompanyAddress(company)

  const applicationCount = applicationCountByCompany.find((cmp) => company.siret == cmp._id)

  const resultCompany: ILbaItemLbaCompany = {
    ideaType: LBA_ITEM_TYPE_OLD.LBA,
    id: company.siret,
    title: company.enseigne,
    place: {
      distance: company.distance ? (roundDistance(company.distance / 1000) ?? 0) : null,
      fullAddress: address,
      latitude: parseFloat(company.geo_coordinates.split(",")[0]),
      longitude: parseFloat(company.geo_coordinates.split(",")[1]),
      city: company.city,
      address,
    },
    company: {
      name: company.enseigne,
      siret: company.siret,
    },
    nafs: [
      {
        label: company.naf_label,
      },
    ],
    applicationCount: applicationCount?.count || 0,
    token: generateApplicationToken({ company_siret: company.siret }),
    recipient_id: `recruteurslba_${company._id.toString()}`,
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
  isMinimalData,
}: {
  companies: ILbaCompany[]
  referer?: string
  caller?: string | null
  applicationCountByCompany: IApplicationCount[]
  isMinimalData: boolean
}): { results: ILbaItemLbaCompany[] } => {
  const transformedCompanies: { results: ILbaItemLbaCompany[] } = { results: [] }

  if (companies?.length) {
    transformedCompanies.results = companies.map((company) => {
      const contactAllowedOrigin = isAllowedSource({ referer, caller })
      return isMinimalData
        ? transformCompanyWithMinimalData({
            company,
            applicationCountByCompany,
          })
        : transformCompany({
            company,
            contactAllowedOrigin,
            caller,
            applicationCountByCompany,
          })
    })
  }

  return transformedCompanies
}

type IRecruteursLbaSearchParams = {
  geo: { latitude: number; longitude: number; radius: number } | null
  romes: string[] | null
}

export const getRecruteursLbaFromDB = async ({ geo, romes }: IRecruteursLbaSearchParams): Promise<ILbaCompany[]> => {
  const query: Filter<ILbaCompany> = {}

  if (romes) {
    query.rome_codes = { $in: romes }
  }

  const filterStages: Document[] =
    geo === null
      ? [{ $match: query }, { $sort: { last_update_at: -1 } }]
      : [
          {
            $geoNear: {
              near: { type: "Point", coordinates: [geo.longitude, geo.latitude] },
              distanceField: "distance",
              maxDistance: geo.radius * 1000,
              query,
            },
          },
          { $sort: { distance: 1, last_update_at: -1 } },
        ]

  return await getDbCollection("recruteurslba")
    .aggregate<ILbaCompany>([
      ...filterStages,
      {
        $limit: 150,
      },
    ])
    .toArray()
}

/**
 * Retourne des sociétés issues de l'algo matchant les critères en paramètres
 */
export const getCompanies = async ({
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

    if (latitude && longitude) {
      companies = (await getDbCollection("recruteurslba")
        .aggregate([
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
        .toArray()) as ILbaCompany[]
    } else {
      companies = (await getDbCollection("recruteurslba")
        .aggregate([
          {
            $match: query,
          },
          {
            $sample: {
              size: companyLimit,
            },
          },
        ])
        .toArray()) as ILbaCompany[]
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
    sentryCaptureException(error)
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
  isMinimalData,
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
  isMinimalData: boolean
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
    return transformCompanies({ companies, referer, caller, applicationCountByCompany, isMinimalData })
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
    const lbaCompany = await getDbCollection("recruteurslba").findOne({ siret })

    if (!lbaCompany) {
      if (caller) {
        trackApiCall({ caller, api_path: "jobV1/company", job_count: 0, result_count: 0, response: "OK" })
      }
      return { error: "not_found", status: 404, result: "not_found", message: "Société non trouvée" }
    }

    if (caller) {
      trackApiCall({ caller, api_path: "jobV1/company", job_count: 1, result_count: 1, response: "OK" })
    }

    const applicationCountByCompany = await getApplicationByCompanyCount([lbaCompany.siret])
    const company = transformCompany({
      company: lbaCompany,
      contactAllowedOrigin: isAllowedSource({ referer, caller }),
      caller,
      applicationCountByCompany,
    })

    return { lbaCompanies: [company] }
  } catch (error) {
    sentryCaptureException(error)
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
export const updateContactInfo = async ({ siret, email, phone }: { siret: string; email?: string; phone?: string }) => {
  const now = new Date()
  try {
    const recruteurLba = await getDbCollection("recruteurslba").findOne({ siret })
    let application: IApplication | null = null
    const fieldUpdates: IRecruteurLbaUpdateEvent[] = []

    if (!recruteurLba) {
      application = await getDbCollection("applications").findOne({ company_siret: siret })

      if (!application) {
        throw badRequest()
      }
    } else {
      await Promise.all([
        email !== undefined && getDbCollection("recruteurslba").findOneAndUpdate({ siret }, { $set: { email, last_update_at: new Date() } }),
        phone !== undefined && getDbCollection("recruteurslba").findOneAndUpdate({ siret }, { $set: { phone, last_update_at: new Date() } }),
      ])
    }

    if (email !== undefined && recruteurLba && recruteurLba.email !== email && !email) {
      fieldUpdates.push({
        _id: new ObjectId(),
        created_at: now,
        siret,
        value: "",
        event: ERecruteurLbaUpdateEventType.DELETE_EMAIL,
      })
    }

    if (phone !== undefined && recruteurLba && recruteurLba.phone !== phone && !phone) {
      fieldUpdates.push({
        _id: new ObjectId(),
        created_at: now,
        siret,
        value: "",
        event: ERecruteurLbaUpdateEventType.DELETE_PHONE,
      })
    }

    if (email && (application || (recruteurLba && recruteurLba.email !== email))) {
      fieldUpdates.push({
        _id: new ObjectId(),
        created_at: now,
        siret,
        value: email,
        event: ERecruteurLbaUpdateEventType.UPDATE_EMAIL,
      })
    }

    if (phone && (application || (recruteurLba && recruteurLba.phone !== phone))) {
      fieldUpdates.push({
        _id: new ObjectId(),
        created_at: now,
        siret,
        value: phone,
        event: ERecruteurLbaUpdateEventType.UPDATE_PHONE,
      })
    }

    fieldUpdates.length && (await getDbCollection("recruteurlbaupdateevents").insertMany(fieldUpdates))

    return { enseigne: application?.company_name ?? recruteurLba?.enseigne, phone, email, siret, active: recruteurLba ? true : false }
  } catch (err) {
    sentryCaptureException(err)
    throw err
  }
}

export const getCompanyContactInfo = async ({ siret }: { siret: string }): Promise<ILbaCompanyForContactUpdate> => {
  try {
    const lbaCompany = await getDbCollection("recruteurslba").findOne({ siret })

    if (lbaCompany) {
      return { enseigne: lbaCompany.enseigne, phone: lbaCompany.phone, email: lbaCompany.email, siret: lbaCompany.siret, active: true }
    } else {
      const application = await getDbCollection("applications").findOne({ company_siret: siret })

      if (application) {
        return { enseigne: application.company_name, siret, phone: "", email: "", active: false }
      }

      throw notFound("Société inconnue")
    }
  } catch (error: any) {
    if (error?.output?.statusCode === 404) {
      throw error
    }
    sentryCaptureException(error)
    throw internal("Erreur de chargement des informations de la société")
  }
}
