import { badRequest, internal, notFound } from "@hapi/boom"
import { escapeRegExp } from "lodash-es"
import type { Document, Filter } from "mongodb"
import { ObjectId } from "mongodb"
import type { IApplication, IRecruteurLbaUpdateEvent } from "shared"
import { ERecruteurLbaUpdateEventType, JOB_STATUS_ENGLISH, JobCollectionName } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import type { OPCOS_LABEL } from "shared/constants/recruteur"
import type { IJobsPartnersOfferPrivate, IJobsPartnersOfferPrivateWithDistance, IJobsPartnersRecruteurAlgoPrivate } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { ILbaCompanyForAdminSearch, ILbaCompanyForContactUpdate, ILbaCompanySearchField } from "shared/routes/update-lba-company.routes"
import { validateSIRET } from "shared/validators/siret-validator"
import { normalizeDepartementToRegex, roundDistance } from "@/common/utils/geolib"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import { generateApplicationToken } from "./app-links.service"
import type { IApplicationCount } from "./application.service"
import { getApplicationByCompanyCount } from "./application.service"
import { getHiringCountLastFullYears } from "./deca-contrats.service"
import { getRecipientID } from "./jobs/job-opportunity/job-opportunity.service"
import type { ILbaItemLbaCompany } from "./lbaitem.shared.service.types"

const setDistance = (distance: number | null | undefined) => {
  if (distance != null && distance != undefined && distance >= 0) {
    return roundDistance(distance / 1000)
  }
  return null
}

/**
 * Adaptation au modèle LBA d'une société issue de l'algo
 */
const transformCompanyV2 = ({
  company,
  applicationCountByCompany,
  hiringCount3Years,
}: {
  company: IJobsPartnersOfferPrivateWithDistance
  applicationCountByCompany: IApplicationCount[]
  hiringCount3Years?: number | null
}): ILbaItemLbaCompany => {
  const applicationCount = applicationCountByCompany.find((cmp) => company.workplace_siret == cmp._id)

  const resultCompany: ILbaItemLbaCompany = {
    ideaType: LBA_ITEM_TYPE.RECRUTEURS_LBA,
    status: company.offer_status,
    id: company.workplace_siret!,
    title: company.workplace_brand || company.workplace_legal_name,
    contact: {
      phone: company.apply_phone,
      hasEmail: company.apply_email ? true : false,
    },
    place: {
      distance: setDistance(company.distance),
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
      elligibleHandicap: company.contract_is_disabled_elligible,
      hiringCount3Years,
    },
    nafs: [
      {
        code: company.workplace_naf_code,
        label: company.workplace_naf_label,
      },
    ],
    applicationCount: applicationCount?.count || 0,
    url: null,
    token: generateApplicationToken({ company_siret: company.workplace_siret! }),
    recipient_id: getRecipientID(JobCollectionName.partners, company._id.toString()),
  }

  return resultCompany
}

type IRecruteursLbaSearchParams = {
  geo: { latitude: number; longitude: number; radius: number } | null
  romes: string[] | null
  departements?: string[] | null
  opco: OPCOS_LABEL | null
  partners_to_exclude?: string[] | null
}

export const getRecruteursLbaFromDB = async ({ geo, romes, opco, departements, partners_to_exclude }: IRecruteursLbaSearchParams): Promise<IJobsPartnersOfferPrivate[]> => {
  if (partners_to_exclude?.includes(JOBPARTNERS_LABEL.RECRUTEURS_LBA)) {
    return []
  }

  const query: Filter<IJobsPartnersOfferPrivate> = { partner_label: LBA_ITEM_TYPE.RECRUTEURS_LBA, offer_status: JOB_STATUS_ENGLISH.ACTIVE }

  if (romes) {
    query.offer_rome_codes = { $in: romes }
  }

  if (departements?.length) {
    const departmentsRegex = departements.flatMap((code) => normalizeDepartementToRegex(code))
    query.workplace_address_zipcode = { $in: departmentsRegex }
  }

  if (opco) {
    query.workplace_opco = opco
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
 * Retourne une société issue de l'algo identifiée par sont SIRET pour le front
 */
export const getRecruteurLbaFromDB = async (siret: string): Promise<ILbaItemLbaCompany> => {
  const lbaCompany = (await getDbCollection("jobs_partners").findOne({
    workplace_siret: siret,
    partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
  })) as IJobsPartnersRecruteurAlgoPrivate

  if (!lbaCompany) {
    throw notFound("Company not found")
  }

  const applicationCountByCompany = await getApplicationByCompanyCount([lbaCompany.workplace_siret!])
  const hiringCount3Years = lbaCompany.workplace_siret ? await getHiringCountLastFullYears(lbaCompany.workplace_siret) : null
  const company = transformCompanyV2({
    company: lbaCompany,
    applicationCountByCompany,
    hiringCount3Years,
  })

  return company
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

    if (fieldUpdates.length) {
      await getDbCollection("recruteurlbaupdateevents").insertMany(fieldUpdates)
    }

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

/**
 * Recherche ciblée des recruteurs issus de l'algo (collection jobs_partners, partner_label = RECRUTEURS_LBA)
 * pour le back-office admin. Recherche sur un seul champ : égalité exacte pour le siret,
 * sinon regex insensible à la casse. Résultats dédupliqués par siret.
 */
export const searchLbaCompaniesForAdmin = async ({ search, field }: { search: string; field: ILbaCompanySearchField }): Promise<ILbaCompanyForAdminSearch[]> => {
  if (field === "workplace_siret" && !validateSIRET(search)) {
    throw badRequest("Le SIRET fourni est invalide")
  }
  const fieldFilter = field === "workplace_siret" ? { workplace_siret: search } : { [field]: { $regex: escapeRegExp(search), $options: "i" } }
  const documents = await getDbCollection("jobs_partners")
    .aggregate<ILbaCompanyForAdminSearch>([
      {
        $match: {
          partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
          ...fieldFilter,
        },
      },
      { $sort: { created_at: -1 } },
      {
        $group: {
          _id: "$workplace_siret",
          siret: { $first: "$workplace_siret" },
          raison_sociale: { $first: "$workplace_legal_name" },
          enseigne: { $first: "$workplace_brand" },
          opco: { $first: "$workplace_opco" },
          address: { $first: "$workplace_address_label" },
          email: { $first: "$apply_email" },
          phone: { $first: "$apply_phone" },
          created_at: { $first: "$created_at" },
        },
      },
      { $sort: { raison_sociale: 1 } },
      { $limit: 100 },
      {
        $project: {
          _id: 0,
          siret: 1,
          raison_sociale: 1,
          enseigne: 1,
          opco: 1,
          address: 1,
          email: 1,
          phone: 1,
          created_at: 1,
        },
      },
    ])
    .toArray()

  return documents
}
