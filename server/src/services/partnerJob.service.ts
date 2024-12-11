import { ObjectId } from "mongodb"
import { NIVEAUX_POUR_LBA, TRAINING_REMOTE_TYPE } from "shared/constants"
import { FRANCE_LATITUDE, FRANCE_LONGITUDE } from "shared/constants/geolocation"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"
import { ILbaItemPartnerJob, traductionJobStatus } from "shared/models"
import { IJobsPartnersOfferPrivate, IJobsPartnersOfferPrivateWithDistance } from "shared/models/jobsPartners.model"

import { IApiError, manageApiError } from "@/common/utils/errorManager"
import { roundDistance } from "@/common/utils/geolib"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { trackApiCall } from "@/common/utils/sendTrackingEvent"
import { sentryCaptureException } from "@/common/utils/sentryUtils"

import { getJobsPartnersFromDBForUI, resolveQuery } from "./jobs/jobOpportunity/jobOpportunity.service"
import { sortLbaJobs } from "./lbajob.service"
import { filterJobsByOpco } from "./opco.service"

/**
 * Converti les offres issues de la mongo en objet de type ILbaItem
 */
export const transformPartnerJobs = ({ partnerJobs, isMinimalData }: { partnerJobs: IJobsPartnersOfferPrivate[]; isMinimalData: boolean }) =>
  partnerJobs.flatMap((partnerJob) => (isMinimalData ? transformPartnerJobWithMinimalData(partnerJob) : transformPartnerJob(partnerJob)))

/**
 * Adaptation au modèle LBAC et conservation des seules infos utilisées de l'offre
 */
function transformPartnerJob(partnerJob: IJobsPartnersOfferPrivateWithDistance): ILbaItemPartnerJob {
  const romes = partnerJob.offer_rome_codes.map((code) => ({ code, label: null }))

  const latitude = partnerJob.workplace_geopoint?.coordinates[1] ?? 0
  const longitude = partnerJob.workplace_geopoint?.coordinates[0] ?? 0

  const resultJob: ILbaItemPartnerJob = {
    ideaType: LBA_ITEM_TYPE_OLD.PARTNER_JOB,
    id: partnerJob._id.toString(),
    title: partnerJob.offer_title,
    place: {
      //lieu de l'offre. contient ville de l'entreprise et geoloc de l'entreprise
      distance: partnerJob.distance ?? false ? roundDistance((partnerJob?.distance ?? 0) / 1000) : null,
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
      name: partnerJob.workplace_name ?? partnerJob.workplace_brand ?? partnerJob.workplace_legal_name ?? "Enseigne inconnue",
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

  return resultJob
}

/**
 * Adaptation au modèle LBAC et conservation des seules infos utilisées de l'offre
 */
function transformPartnerJobWithMinimalData(partnerJob: IJobsPartnersOfferPrivateWithDistance): ILbaItemPartnerJob {
  const latitude = partnerJob.workplace_geopoint?.coordinates[1] ?? 0
  const longitude = partnerJob.workplace_geopoint?.coordinates[0] ?? 0

  const resultJob: ILbaItemPartnerJob = {
    ideaType: LBA_ITEM_TYPE_OLD.PARTNER_JOB,
    id: partnerJob._id.toString(),
    title: partnerJob.offer_title,
    place: {
      //lieu de l'offre. contient ville de l'entreprise et geoloc de l'entreprise
      distance: partnerJob.distance ?? false ? roundDistance((partnerJob?.distance ?? 0) / 1000) : null,
      fullAddress: partnerJob.workplace_address_label,
      latitude,
      longitude,
    },
    company: {
      siret: partnerJob.workplace_siret,
      name: partnerJob.workplace_name ?? partnerJob.workplace_brand ?? partnerJob.workplace_legal_name ?? "Enseigne inconnue",
      opco: { label: partnerJob.workplace_opco, url: null },
    },
    job: {
      creationDate: partnerJob.offer_creation ? new Date(partnerJob.offer_creation) : null,
    },
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
    }

    const resolvedQuery = await resolveQuery({
      latitude: params.lat,
      longitude: params.lon,
      radius: params.distance,
      target_diploma_level: params.niveau,
      romes: params.romes,
      rncp: null,
    })

    const rawPartnerJobs = await getJobsPartnersFromDBForUI(resolvedQuery)

    let partnerJobs: ILbaItemPartnerJob[] = transformPartnerJobs({ partnerJobs: rawPartnerJobs, isMinimalData })

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

    const partnerJob = transformPartnerJob(rawPartnerJob)

    if (caller) {
      trackApiCall({ caller: caller, job_count: 1, result_count: 1, api_path: "jobV1/partnerJob", response: "OK" })
    }

    return { partnerJobs: [partnerJob] }
  } catch (error) {
    sentryCaptureException(error)
    return manageApiError({ error, api_path: "jobV1/matcha", caller, errorTitle: "getting job by id from partner jobs" })
  }
}
