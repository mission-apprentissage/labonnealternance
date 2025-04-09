import { badRequest, internal, notFound } from "@hapi/boom"
import { Document, Filter, ObjectId } from "mongodb"
import { ERecruteurLbaUpdateEventType, IApplication, IRecruteurLbaUpdateEvent, JobCollectionName } from "shared"
import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"
import { IJobsPartnersOfferPrivate, IJobsPartnersRecruteurAlgoPrivate, JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { ILbaCompanyForContactUpdate } from "shared/routes/updateLbaCompany.routes"

import { getRecipientID } from "@/services/jobs/jobOpportunity/jobOpportunity.service"

import { encryptMailWithIV } from "../common/utils/encryptString"
import { IApiError, manageApiError } from "../common/utils/errorManager"
import { isAllowedSource } from "../common/utils/isAllowedSource"
import { getDbCollection } from "../common/utils/mongodbUtils"
import { trackApiCall } from "../common/utils/sendTrackingEvent"
import { sentryCaptureException } from "../common/utils/sentryUtils"

import { getApplicationByCompanyCount, IApplicationCount } from "./application.service"
import { generateApplicationToken } from "./appLinks.service"
import { TLbaItemResult } from "./jobOpportunity.service.types"
import { ILbaItemLbaCompany } from "./lbaitem.shared.service.types"

/**
 * Adaptation au modèle LBA d'une société issue de l'algo
 * To remove once V1 is decommissioned
 */
const transformCompany = ({
  company,
  contactAllowedOrigin,
  applicationCountByCompany,
}: {
  company: IJobsPartnersRecruteurAlgoPrivate
  caller?: string | null
  contactAllowedOrigin: boolean
  applicationCountByCompany: IApplicationCount[]
}): ILbaItemLbaCompany => {
  const contact: {
    email?: string
    iv?: string
    phone?: string | null
  } = encryptMailWithIV({ value: company.apply_email !== "null" ? company.apply_email : "" })

  if (contactAllowedOrigin) {
    contact.phone = company.apply_phone
  }

  const applicationCount = applicationCountByCompany.find((cmp) => company.workplace_siret == cmp._id)

  const resultCompany: ILbaItemLbaCompany = {
    ideaType: LBA_ITEM_TYPE_OLD.LBA,
    // ideaType: LBA_ITEM_TYPE.RECRUTEURS_LBA,
    id: company.workplace_siret,
    title: company.workplace_brand || company.workplace_legal_name,
    contact,
    place: {
      distance: null,
      fullAddress: company.workplace_address_label,
      longitude: company.workplace_geopoint.coordinates[0],
      latitude: company.workplace_geopoint.coordinates[1],
      city: company.workplace_address_city,
      address: company.workplace_address_label,
    },
    company: {
      name: company.workplace_legal_name,
      siret: company.workplace_siret,
      size: company.workplace_size,
      url: company.workplace_website,
      opco: {
        label: company.workplace_opco,
        url: null,
      },
    },
    nafs: [
      {
        code: company.workplace_naf_code,
        label: company.workplace_naf_label,
      },
    ],
    applicationCount: applicationCount?.count || 0,
    url: null,
    token: generateApplicationToken({ company_siret: company.workplace_siret }),
    recipient_id: getRecipientID(JobCollectionName.recruteur, company.workplace_siret),
  }

  return resultCompany
}

/**
 * Adaptation au modèle LBA d'une société issue de l'algo avec les données minimales nécessaires pour l'ui LBA
 * To remove once V1 is decommissioned
 */
const transformCompanyWithMinimalData = ({
  company,
  applicationCountByCompany,
}: {
  company: IJobsPartnersRecruteurAlgoPrivate
  applicationCountByCompany: IApplicationCount[]
}): ILbaItemLbaCompany => {
  // format différent selon accès aux bonnes boîtes par recherche ou par siret

  const applicationCount = applicationCountByCompany.find((cmp) => company.workplace_siret == cmp._id)

  const resultCompany: ILbaItemLbaCompany = {
    ideaType: LBA_ITEM_TYPE_OLD.LBA,
    id: company.workplace_siret,
    title: company.workplace_brand || company.workplace_legal_name,
    place: {
      distance: null,
      fullAddress: company.workplace_address_label,
      longitude: company.workplace_geopoint.coordinates[0],
      latitude: company.workplace_geopoint.coordinates[1],
      city: company.workplace_address_city,
      address: company.workplace_address_label,
    },
    company: {
      name: company.workplace_legal_name,
      siret: company.workplace_siret,
    },
    nafs: [
      {
        label: company.workplace_naf_label,
      },
    ],
    applicationCount: applicationCount?.count || 0,
    token: generateApplicationToken({ company_siret: company.workplace_siret }),
    recipient_id: getRecipientID(JobCollectionName.recruteur, company.workplace_siret),
  }

  return resultCompany
}

/**
 * Adaptation au modèle LBA d'une société issue de l'algo
 */
const transformCompanyV2 = ({
  company,
  applicationCountByCompany,
}: {
  company: IJobsPartnersRecruteurAlgoPrivate
  applicationCountByCompany: IApplicationCount[]
}): ILbaItemLbaCompany => {
  const applicationCount = applicationCountByCompany.find((cmp) => company.workplace_siret == cmp._id)

  const resultCompany: ILbaItemLbaCompany = {
    ideaType: LBA_ITEM_TYPE.RECRUTEURS_LBA,
    id: company.workplace_siret,
    title: company.workplace_brand || company.workplace_legal_name,
    contact: {
      phone: company.apply_phone,
      email: company.apply_email,
    },
    place: {
      distance: null,
      fullAddress: company.workplace_address_label,
      longitude: company.workplace_geopoint.coordinates[0],
      latitude: company.workplace_geopoint.coordinates[1],
      city: company.workplace_address_city,
      address: company.workplace_address_label,
    },
    company: {
      name: company.workplace_legal_name,
      siret: company.workplace_siret,
      size: company.workplace_size,
      url: company.workplace_website,
      opco: {
        label: company.workplace_opco,
        url: null,
      },
    },
    nafs: [
      {
        code: company.workplace_naf_code,
        label: company.workplace_naf_label,
      },
    ],
    applicationCount: applicationCount?.count || 0,
    url: null,
    token: generateApplicationToken({ company_siret: company.workplace_siret }),
    recipient_id: `partners_${company._id.toString()}`,
  }

  return resultCompany
}

/**
 * Adaptation au modèle LBA d'une société issue de l'algo avec les données minimales nécessaires pour l'ui LBA
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const transformCompanyWithMinimalDataV2 = ({
  company,
  applicationCountByCompany,
}: {
  company: IJobsPartnersRecruteurAlgoPrivate
  applicationCountByCompany: IApplicationCount[]
}): ILbaItemLbaCompany => {
  const applicationCount = applicationCountByCompany.find((cmp) => company.workplace_siret == cmp._id)

  const resultCompany: ILbaItemLbaCompany = {
    ideaType: LBA_ITEM_TYPE.RECRUTEURS_LBA,
    id: company.workplace_siret,
    title: company.workplace_brand || company.workplace_legal_name,
    place: {
      distance: null,
      fullAddress: company.workplace_address_label,
      longitude: company.workplace_geopoint.coordinates[0],
      latitude: company.workplace_geopoint.coordinates[1],
      city: company.workplace_address_city,
      address: company.workplace_address_label,
    },
    company: {
      name: company.workplace_legal_name,
      siret: company.workplace_siret,
    },
    nafs: [
      {
        label: company.workplace_naf_label,
      },
    ],
    applicationCount: applicationCount?.count || 0,
    token: generateApplicationToken({ company_siret: company.workplace_siret }),
    recipient_id: `partners_${company._id.toString()}`,
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
  companies: IJobsPartnersRecruteurAlgoPrivate[]
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

export const getRecruteursLbaFromDB = async ({ geo, romes }: IRecruteursLbaSearchParams): Promise<IJobsPartnersOfferPrivate[]> => {
  const query: Filter<IJobsPartnersOfferPrivate> = { partner_label: LBA_ITEM_TYPE.RECRUTEURS_LBA }

  if (romes) {
    query.offer_rome_codes = { $in: romes }
  }

  const filterStages: Document[] =
    geo === null
      ? [{ $match: query }, { $sort: { last_update_at: -1 } }]
      : [
          {
            $geoNear: {
              near: { type: "Point", coordinates: [geo.longitude, geo.latitude] },
              distanceField: "distance",
              key: "workplace_geopoint",
              maxDistance: geo.radius * 1000,
              query,
            },
          },
          { $sort: { distance: 1 } },
        ]

  return await getDbCollection("jobs_partners")
    .aggregate<IJobsPartnersOfferPrivate>([
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
}): Promise<IJobsPartnersRecruteurAlgoPrivate[] | IApiError> => {
  try {
    const distance = radius || 10

    const query: any = { partner_label: LBA_ITEM_TYPE.RECRUTEURS_LBA }

    if (romes) {
      query.offer_rome_codes = { $in: romes?.split(",") }
    }

    if (opco) {
      query.workplace_opco = opco.toUpperCase()
    }

    // TODO 20250212 obsolete, to check if still used
    if (opcoUrl) {
      query.opco_url = opcoUrl.toLowerCase()
    }

    let companies: IJobsPartnersRecruteurAlgoPrivate[] = []

    if (latitude && longitude) {
      companies = (await getDbCollection("jobs_partners")
        .aggregate([
          {
            $geoNear: {
              near: { type: "Point", coordinates: [longitude, latitude] },
              distanceField: "distance",
              key: "workplace_geopoint",
              maxDistance: distance * 1000,
              query,
            },
          },
          {
            $limit: companyLimit,
          },
        ])
        .toArray()) as IJobsPartnersRecruteurAlgoPrivate[]
    } else {
      companies = (await getDbCollection("jobs_partners")
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
        .toArray()) as IJobsPartnersRecruteurAlgoPrivate[]
    }

    if (!latitude) {
      companies.sort((a, b) => {
        if (!a?.workplace_legal_name) return -1
        if (!b?.workplace_legal_name) return 1
        return a.workplace_legal_name.toLowerCase().localeCompare(b.workplace_legal_name.toLowerCase())
      })
    }

    return companies
  } catch (error) {
    sentryCaptureException(error)
    return manageApiError({ error, api_path: api, caller, errorTitle: `getting recruteurs_lba from jobs_partners collection (${api})` })
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
    const sirets = companies.map(({ workplace_siret }) => workplace_siret)
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
    const lbaCompany = (await getDbCollection("jobs_partners").findOne({
      workplace_siret: siret,
      partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
    })) as IJobsPartnersRecruteurAlgoPrivate

    if (!lbaCompany) {
      if (caller) {
        trackApiCall({ caller, api_path: "jobV1/company", job_count: 0, result_count: 0, response: "OK" })
      }
      return { error: "not_found", status: 404, result: "not_found", message: "Société non trouvée" }
    }

    if (caller) {
      trackApiCall({ caller, api_path: "jobV1/company", job_count: 1, result_count: 1, response: "OK" })
    }

    const applicationCountByCompany = await getApplicationByCompanyCount([lbaCompany.workplace_siret!])
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
 * Retourne une société issue de l'algo identifiée par sont SIRET pour le front
 */
export const getRecruteurLbaFromDB = async (siret: string): Promise<ILbaItemLbaCompany> => {
  try {
    const lbaCompany = (await getDbCollection("jobs_partners").findOne({
      workplace_siret: siret,
      partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
    })) as IJobsPartnersRecruteurAlgoPrivate

    if (!lbaCompany) {
      throw badRequest("Company not found")
    }

    const applicationCountByCompany = await getApplicationByCompanyCount([lbaCompany.workplace_siret!])
    const company = transformCompanyV2({
      company: lbaCompany,
      applicationCountByCompany,
    })

    return company
  } catch (error) {
    sentryCaptureException(error)
    throw badRequest("Company not found")
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
export const updateContactInfo = async ({ siret, email, phone }: { siret: string; email: string | null; phone: string | null }) => {
  const now = new Date()
  try {
    const recruteurLba = await getDbCollection("jobs_partners").findOne({ workplace_siret: siret, partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA })
    let application: IApplication | null = null
    const fieldUpdates: IRecruteurLbaUpdateEvent[] = []

    if (!recruteurLba) {
      application = await getDbCollection("applications").findOne({ company_siret: siret })

      if (!application) {
        throw badRequest()
      }
    } else {
      await getDbCollection("jobs_partners").findOneAndUpdate(
        { workplace_siret: recruteurLba.workplace_siret, partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA },
        { $set: { apply_email: email, apply_phone: phone, updated_at: new Date() } }
      )
    }

    if (email !== undefined && recruteurLba && recruteurLba.apply_email !== email && !email) {
      fieldUpdates.push({
        _id: new ObjectId(),
        created_at: now,
        siret,
        value: "",
        event: ERecruteurLbaUpdateEventType.DELETE_EMAIL,
      })
    }

    if (phone !== undefined && recruteurLba && recruteurLba.apply_phone !== phone && !phone) {
      fieldUpdates.push({
        _id: new ObjectId(),
        created_at: now,
        siret,
        value: "",
        event: ERecruteurLbaUpdateEventType.DELETE_PHONE,
      })
    }

    if (email && (application || (recruteurLba && recruteurLba.apply_email !== email))) {
      fieldUpdates.push({
        _id: new ObjectId(),
        created_at: now,
        siret,
        value: email,
        event: ERecruteurLbaUpdateEventType.UPDATE_EMAIL,
      })
    }

    if (phone && (application || (recruteurLba && recruteurLba.apply_phone !== phone))) {
      fieldUpdates.push({
        _id: new ObjectId(),
        created_at: now,
        siret,
        value: phone,
        event: ERecruteurLbaUpdateEventType.UPDATE_PHONE,
      })
    }

    fieldUpdates.length && (await getDbCollection("recruteurlbaupdateevents").insertMany(fieldUpdates))

    return { enseigne: application?.company_name || recruteurLba?.workplace_brand || recruteurLba?.workplace_legal_name, phone, email, siret, active: recruteurLba ? true : false }
  } catch (err) {
    sentryCaptureException(err)
    throw err
  }
}

export const getCompanyContactInfo = async ({ siret }: { siret: string }): Promise<ILbaCompanyForContactUpdate> => {
  try {
    const lbaCompany = await getDbCollection("jobs_partners").findOne({ workplace_siret: siret, partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA })

    if (lbaCompany) {
      return {
        enseigne: lbaCompany.workplace_brand || lbaCompany.workplace_legal_name,
        phone: lbaCompany.apply_phone,
        email: lbaCompany.apply_email,
        siret: lbaCompany.workplace_siret!,
        active: true,
      }
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
