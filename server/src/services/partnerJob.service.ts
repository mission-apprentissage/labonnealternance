import { badRequest } from "@hapi/boom"
import { ObjectId } from "mongodb"
import { FRANCE_LATITUDE, FRANCE_LONGITUDE } from "shared/constants/geolocation"
import { NIVEAUX_POUR_LBA, OPCOS_LABEL, TRAINING_REMOTE_TYPE } from "shared/constants/index"
import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD, UNKNOWN_COMPANY } from "shared/constants/lbaitem"
import { ILbaItemPartnerJob, JOB_STATUS_ENGLISH, traductionJobStatus } from "shared/models/index"
import { IJobsPartnersOfferPrivate, IJobsPartnersOfferPrivateWithDistance, JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"

import { IApiError, manageApiError } from "@/common/utils/errorManager"
import { roundDistance } from "@/common/utils/geolib"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { trackApiCall } from "@/common/utils/sendTrackingEvent"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { getApplicationByJobCount, IApplicationCount } from "@/services/application.service"

import { generateApplicationToken } from "./appLinks.service"
import { getJobsPartnersFromDBForUI, resolveQuery } from "./jobs/jobOpportunity/jobOpportunity.service"
import { sortLbaJobs } from "./lbajob.service"
import { filterJobsByOpco } from "./opco.service"

/**
 * Converti les offres issues de la mongo en objet de type ILbaItem
 */
export const transformPartnerJobs = ({
  partnerJobs,
  isMinimalData,
  applicationCountByJob,
}: {
  partnerJobs: IJobsPartnersOfferPrivate[]
  isMinimalData: boolean
  applicationCountByJob: null | IApplicationCount[]
}) =>
  partnerJobs.flatMap((partnerJob) =>
    isMinimalData ? transformPartnerJobWithMinimalData(partnerJob, applicationCountByJob) : transformPartnerJob(partnerJob, "V2", applicationCountByJob)
  )

/**
 * Adaptation au modèle LBAC et conservation des seules infos utilisées de l'offre
 */
function transformPartnerJob(
  partnerJob: IJobsPartnersOfferPrivateWithDistance,
  version: "V1" | "V2" = "V1",
  applicationCountByJob?: null | IApplicationCount[]
): ILbaItemPartnerJob {
  const romes = partnerJob.offer_rome_codes.map((code) => ({ code, label: null }))
  const longitude = partnerJob.workplace_geopoint.coordinates[0]
  const latitude = partnerJob.workplace_geopoint.coordinates[1]
  const id = partnerJob._id.toString()

  const recipient_id =
    version === "V1" ? `partners_${id}` : partnerJob.partner_label === JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA ? `recruiters_${partnerJob.partner_job_id}` : `partners_${id}`

  const resultJob: ILbaItemPartnerJob = {
    id,
    ideaType:
      version === "V1"
        ? LBA_ITEM_TYPE_OLD.PARTNER_JOB
        : partnerJob.partner_label === JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA
          ? LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA
          : LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES,
    title: partnerJob.offer_title,
    token: generateApplicationToken({ jobId: id }),
    recipient_id,
    place: {
      //lieu de l'offre. contient ville de l'entreprise et geoloc de l'entreprise
      distance: partnerJob?.distance != null && partnerJob?.distance >= 0 ? roundDistance((partnerJob?.distance ?? 0) / 1000) : null,
      fullAddress: partnerJob.workplace_address_label,
      latitude,
      longitude,
      numberAndStreet: partnerJob.workplace_address_street_label,
      city: partnerJob.workplace_address_city,
      zipCode: partnerJob.workplace_address_zipcode,
      remoteOnly: partnerJob?.contract_remote === TRAINING_REMOTE_TYPE.remote ? true : false,
    },
    company: {
      siret: partnerJob.workplace_siret,
      name: partnerJob.workplace_name ?? partnerJob.workplace_brand ?? partnerJob.workplace_legal_name ?? UNKNOWN_COMPANY,
      size: partnerJob.workplace_size,
      opco: { label: partnerJob.workplace_opco, url: null },
      url: partnerJob.workplace_website,
    },
    job: {
      id: partnerJob.partner_job_id,
      partner_label: partnerJob.partner_label,
      description: partnerJob.offer_description,
      employeurDescription: partnerJob.workplace_description,
      creationDate: partnerJob.offer_creation && new Date(partnerJob.offer_creation),
      type: partnerJob.contract_type,
      jobStartDate: partnerJob.contract_start && new Date(partnerJob.contract_start),
      dureeContrat: partnerJob.contract_duration ? `${partnerJob.contract_duration} mois` : null,
      jobExpirationDate: partnerJob.offer_expiration && new Date(partnerJob.offer_expiration),
      quantiteContrat: partnerJob.offer_opening_count,
      origin: partnerJob.offer_origin,
      status: partnerJob.offer_status && traductionJobStatus(partnerJob.offer_status),
      offer_desired_skills: partnerJob.offer_desired_skills,
      offer_to_be_acquired_skills: partnerJob.offer_to_be_acquired_skills,
      offer_access_conditions: partnerJob.offer_access_conditions,
    },

    contact: {
      email: partnerJob.apply_email,
      phone: partnerJob.apply_phone,
      url: partnerJob.apply_url,
    },

    nafs: [{ label: partnerJob.workplace_naf_label, code: partnerJob.workplace_naf_code }],
    romes,
    target_diploma_level: partnerJob?.offer_target_diploma?.label || null,
  }

  if (applicationCountByJob) {
    resultJob.applicationCount = applicationCountByJob.find(({ _id }) => _id === partnerJob.partner_job_id)?.count ?? 0
  }

  return resultJob
}

//TODO: travailler toutes les urls des emails de candidatures

/**
 * Adaptation au modèle LBAC et conservation des seules infos utilisées de l'offre
 */
function transformPartnerJobWithMinimalData(partnerJob: IJobsPartnersOfferPrivateWithDistance, applicationCountByJob: null | IApplicationCount[]): ILbaItemPartnerJob {
  const longitude = partnerJob.workplace_geopoint.coordinates[0]
  const latitude = partnerJob.workplace_geopoint.coordinates[1]

  const resultJob: ILbaItemPartnerJob = {
    ideaType: partnerJob.partner_label === JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA ? LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA : LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES,
    id: partnerJob._id.toString(),
    title: partnerJob.offer_title,
    place: {
      //lieu de l'offre. contient ville de l'entreprise et geoloc de l'entreprise
      distance: partnerJob?.distance != null && partnerJob?.distance >= 0 ? roundDistance((partnerJob?.distance ?? 0) / 1000) : null,
      fullAddress: partnerJob.workplace_address_label,
      latitude,
      longitude,
    },
    company: {
      siret: partnerJob.workplace_siret,
      name: partnerJob.workplace_name ?? partnerJob.workplace_brand ?? partnerJob.workplace_legal_name ?? UNKNOWN_COMPANY,
      opco: { label: partnerJob.workplace_opco, url: null },
    },
    job: {
      creationDate: partnerJob.offer_creation ? new Date(partnerJob.offer_creation) : null,
    },
    // KBA 20250131 Quick fix, to remove once return type LBA_ITEM is merge when all jobs comes only from JOBS_PARTNERS COLLECTION
    token: "",
    recipient_id: "",
  }

  if (applicationCountByJob) {
    const applicationCount = applicationCountByJob.find(({ _id }) => _id === partnerJob.partner_job_id)
    resultJob.applicationCount = applicationCount?.count ?? 0
  }

  return resultJob
}

/**
 * @description Retourne les offres d'emploi partner correspondantes aux critères de recherche
 */
export const getPartnerJobs = async ({
  romes = "",
  radius = 10,
  latitude,
  longitude,
  api,
  opco,
  opcoUrl,
  diploma,
  caller,
  isMinimalData,
  force_partner_label,
}: {
  romes?: string
  radius?: number
  latitude?: number
  longitude?: number
  api: string
  opco?: string
  opcoUrl?: string
  diploma?: string
  caller?: string | null
  isMinimalData: boolean
  force_partner_label?: JOBPARTNERS_LABEL
}) => {
  if (radius === 0) {
    radius = 10
  }
  try {
    const hasLocation = Boolean(latitude)

    const distance = hasLocation ? radius : 21000

    const params = {
      caller,
      romes: romes?.split(","),
      distance,
      lat: hasLocation ? (latitude as number) : FRANCE_LATITUDE,
      lon: hasLocation ? (longitude as number) : FRANCE_LONGITUDE,
      niveau: diploma ? NIVEAUX_POUR_LBA[diploma] : undefined,
      isMinimalData,
      opco,
    }

    const opcoParam = (params.opco ?? null) as OPCOS_LABEL | null

    const resolvedQuery = await resolveQuery({
      latitude: params.lat,
      longitude: params.lon,
      radius: params.distance,
      target_diploma_level: params.niveau,
      romes: params.romes,
      rncp: null,
      opco: opcoParam,
    })

    const rawPartnerJobs = await getJobsPartnersFromDBForUI({ ...resolvedQuery, force_partner_label })

    let applicationCountByJob: null | IApplicationCount[] = null

    if (force_partner_label === JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA) {
      const ids = rawPartnerJobs.map(({ partner_job_id }) => partner_job_id)
      applicationCountByJob = await getApplicationByJobCount(ids)
    }
    let partnerJobs: ILbaItemPartnerJob[] = transformPartnerJobs({ partnerJobs: rawPartnerJobs, isMinimalData, applicationCountByJob })

    // filtrage sur l'opco
    if (opco && partnerJobs) {
      partnerJobs = await filterJobsByOpco({ opco, opcoUrl, jobs: partnerJobs })
    }

    if (!hasLocation) {
      sortLbaJobs(partnerJobs)
    }

    return { results: partnerJobs }
  } catch (error) {
    sentryCaptureException(error)
    return manageApiError({ error, api_path: api, caller, errorTitle: `getting jobs from partner job (${api})` })
  }
}

export const getPartnerJobById = async ({ id, caller }: { id: ObjectId; caller?: string }): Promise<IApiError | { partnerJobs: ILbaItemPartnerJob[] }> => {
  try {
    const rawPartnerJob = await getDbCollection("jobs_partners").findOne({ _id: id })

    if (!rawPartnerJob) {
      return { error: "not_found" }
    }

    const partnerJob = transformPartnerJob(rawPartnerJob, "V1")

    if (caller) {
      trackApiCall({ caller: caller, job_count: 1, result_count: 1, api_path: "jobV1/partnerJob", response: "OK" })
    }

    return { partnerJobs: [partnerJob] }
  } catch (error) {
    sentryCaptureException(error)
    return manageApiError({ error, api_path: "jobV1/matcha", caller, errorTitle: "getting job by id from partner jobs" })
  }
}

export const getPartnerJobByIdV2 = async (id: string): Promise<ILbaItemPartnerJob> => {
  const rawPartnerJob = await getDbCollection("jobs_partners").findOne({ _id: new ObjectId(id) })

  if (!rawPartnerJob) {
    throw badRequest("Job not found")
  }

  let applicationCountByJob: null | IApplicationCount[] = null
  if (rawPartnerJob.partner_label === JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA) {
    applicationCountByJob = await getApplicationByJobCount([rawPartnerJob.partner_job_id])
  }

  const partnerJob = transformPartnerJob(rawPartnerJob, "V2", applicationCountByJob)

  return partnerJob
}

export const anonymizeLbaJobsPartners = async ({ partner_job_ids }: { partner_job_ids: string[] }) => {
  const jobsPartnersCollection = getDbCollection("jobs_partners")
  const now = new Date()
  const result = await jobsPartnersCollection.updateMany(
    { partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, partner_job_id: { $in: partner_job_ids } },
    {
      $set: {
        apply_email: null,
        apply_phone: null,
        apply_url: null,
        offer_description: "",
        workplace_description: null,
        offer_status: JOB_STATUS_ENGLISH.ANNULEE,
        updated_at: now,
        offer_status_history: [
          {
            status: JOB_STATUS_ENGLISH.ANNULEE,
            reason: "recruiter has been anonymized",
            date: now,
            granted_by: "lba",
          },
        ],
      },
    }
  )

  return result
}
