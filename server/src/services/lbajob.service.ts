import { badRequest, internal } from "@hapi/boom"
import dayjs from "dayjs"
import { Document, Filter, ObjectId } from "mongodb"
import { IJob, ILbaItemPartnerJob, IRecruiter, IReferentielRomeForJob, JOB_STATUS } from "shared"
import { NIVEAUX_POUR_LBA } from "shared/constants"
import { FRANCE_LATITUDE, FRANCE_LONGITUDE } from "shared/constants/geolocation"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"
import { INiveauPourLbaLabel, RECRUITER_STATUS } from "shared/constants/recruteur"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { encryptMailWithIV } from "../common/utils/encryptString"
import { IApiError, manageApiError } from "../common/utils/errorManager"
import { roundDistance } from "../common/utils/geolib"
import { trackApiCall } from "../common/utils/sendTrackingEvent"
import { sentryCaptureException } from "../common/utils/sentryUtils"

import { IApplicationCount, getApplicationByJobCount } from "./application.service"
import { generateApplicationToken } from "./appLinks.service"
import { getOffreAvecInfoMandataire, romeDetailAggregateStages } from "./formulaire.service"
import { ILbaItemLbaJob } from "./lbaitem.shared.service.types"
import { filterJobsByOpco } from "./opco.service"

const JOB_SEARCH_LIMIT = 250
/**
 * @description get filtered jobs with rome_detail from mongo
 * @param {Object} payload
 * @param {number} payload.distance
 * @param {number} payload.lat
 * @param {number} payload.long
 * @param {string[]} payload.romes
 * @param {string} payload.niveau
 * @returns {Promise<IRecruiter[]>}
 * @description get OFFRES_EMPLOI_LBA
 */
export const getJobs = async ({
  distance,
  lat,
  lon,
  romes,
  niveau,
  isMinimalData,
}: {
  distance: number
  lat: number | undefined
  lon: number | undefined
  romes: string[]
  niveau: string | null
  isMinimalData: boolean
}): Promise<IRecruiter[]> => {
  const expirationDateLimit = dayjs().add(-1, "day").toDate()

  const query: Filter<IRecruiter> = {
    status: RECRUITER_STATUS.ACTIF,
    "jobs.job_status": JOB_STATUS.ACTIVE,
    "jobs.rome_code": { $in: romes },
    "jobs.job_expiration_date": { $gt: expirationDateLimit },
  }

  if (niveau && niveau !== NIVEAUX_POUR_LBA["INDIFFERENT"]) {
    query["jobs.job_level_label"] = { $in: [niveau, NIVEAUX_POUR_LBA["INDIFFERENT"]] }
  }

  const stages: Document[] = [
    {
      $geoNear: {
        near: { type: "Point", coordinates: [lon, lat] },
        distanceField: "distance",
        maxDistance: distance * 1000,
        query,
      },
    },
    {
      $limit: JOB_SEARCH_LIMIT,
    },
  ]

  // TODO: add a limit stage in romeDetailAggregateStages to limit number of jobs (not only number of recruiters)
  if (!isMinimalData) {
    stages.push(...romeDetailAggregateStages)
  }

  const recruiters = await getDbCollection("recruiters").aggregate<IRecruiter>(stages).toArray()

  const recruitersWithJobs = await Promise.all(
    recruiters.map(async (recruiter) => {
      const [firstJob] = recruiter.jobs
      if (!firstJob) {
        return recruiter
      }

      await replaceRecruiterFieldsWithCfaFields(recruiter)

      const jobs: any[] = []
      recruiter.jobs.forEach((job) => {
        if (romes.some((item) => job.rome_code.includes(item)) && job.job_status === JOB_STATUS.ACTIVE && dayjs(job.job_expiration_date).isAfter(expirationDateLimit)) {
          job.rome_label = job.rome_appellation_label ?? job.rome_label
          if (!niveau || NIVEAUX_POUR_LBA["INDIFFERENT"] === job.job_level_label || niveau === job.job_level_label) {
            jobs.push(job)
          }
        }
      })
      recruiter.jobs = jobs
      return recruiter
    })
  )

  return recruitersWithJobs
}

export type IJobResult = {
  recruiter: Omit<IRecruiter, "jobs">
  job: IJob & { rome_detail: IReferentielRomeForJob }
}

export const getLbaJobsV2 = async ({
  geo,
  romes,
  niveau,
  limit,
}: {
  geo: { latitude: number; longitude: number; radius: number } | null
  romes: string[] | null
  niveau: INiveauPourLbaLabel | null
  limit: number
}): Promise<IJobResult[]> => {
  const jobFilters: Filter<IRecruiter> = {
    "jobs.job_status": JOB_STATUS.ACTIVE,
    "jobs.job_expiration_date": { $gt: dayjs().add(-1, "day").toDate() },
  }

  if (romes) {
    jobFilters["jobs.rome_code"] = { $in: romes }
  }

  if (niveau && niveau !== NIVEAUX_POUR_LBA["INDIFFERENT"]) {
    jobFilters["jobs.job_level_label"] = { $in: [niveau, NIVEAUX_POUR_LBA["INDIFFERENT"]] }
  }

  const query: Filter<IRecruiter> = {
    status: RECRUITER_STATUS.ACTIF,
    ...jobFilters,
  }

  const filterStage: Document[] =
    geo === null
      ? // Sans géoloc, on trie par date de création (Important de le faire avant le $limit)
        [
          { $match: query },
          { $sort: { "jobs.job_creation_date": -1 } },
          { $limit: limit },
          { $unwind: { path: "$jobs" } },
          // Make sure to sort after unwinding
          { $sort: { "jobs.job_creation_date": -1 } },
        ]
      : [
          // Avec géoloc, on trie par distance (comportement par défaut de $geoNear)
          {
            $geoNear: {
              near: { type: "Point", coordinates: [geo.longitude, geo.latitude] },
              distanceField: "distance",
              maxDistance: geo.radius * 1000,
              query,
            },
          },
          { $limit: limit },
          { $unwind: { path: "$jobs" } },
          { $sort: { distance: 1, "jobs.job_creation_date": -1 } },
        ]

  const recruiters = await getDbCollection("recruiters")
    .aggregate<IJobResult["recruiter"] & { jobs: IJobResult["job"] }>([
      ...filterStage,
      // Apply filters again on jobs individually
      { $match: jobFilters },
      // Limit the actual number of jobs returned
      { $limit: limit },
      // We only lookup the first rome code --> match will be only on the first rome code
      {
        $lookup: {
          from: "referentielromes",
          localField: "jobs.rome_code.0",
          foreignField: "rome.code_rome",
          as: "jobs.rome_detail",
        },
      },
      // Here we will have only one rome_detail, so we unwind it
      { $unwind: { path: "$jobs.rome_detail" } },
    ])
    .toArray()

  return Promise.all(
    recruiters.map(async ({ jobs: job, ...recruiter }) => {
      const contactInfo = await getLbaJobContactInfo(recruiter)
      return {
        recruiter: {
          ...recruiter,
          ...contactInfo,
        },
        job: {
          ...job,
          rome_label: job.rome_appellation_label ?? job.rome_label,
        },
      }
    })
  )
}

/**
 * @description Retourne les OFFRES_EMPLOI_LBA correspondantes aux critères de recherche
 */
export const getLbaJobs = async ({
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

    const jobs = await getJobs(params)

    //console.log("partnerJobs : ", rawPartnerJobs.length, rawPartnerJobs)

    const ids = jobs.flatMap((recruiter) => (recruiter?.jobs ? recruiter.jobs.map(({ _id }) => _id.toString()) : []))

    const applicationCountByJob = await getApplicationByJobCount(ids)

    const lbaJobs: { results: ILbaItemLbaJob[] } = transformLbaJobs({ jobs, applicationCountByJob, isMinimalData })

    // filtrage sur l'opco
    if (opco || opcoUrl) {
      lbaJobs.results = await filterJobsByOpco({ opco, opcoUrl, jobs: lbaJobs.results })
    }

    if (!hasLocation) {
      sortLbaJobs(lbaJobs.results)
    }

    return lbaJobs
  } catch (error) {
    sentryCaptureException(error)
    return manageApiError({ error, api_path: api, caller, errorTitle: `getting jobs from Matcha (${api})` })
  }
}

/**
 * Converti les offres issues de la mongo en objet de type ILbaItem
 */
function transformLbaJobs({ jobs, applicationCountByJob, isMinimalData }: { jobs: IRecruiter[]; applicationCountByJob: IApplicationCount[]; isMinimalData: boolean }): {
  results: ILbaItemLbaJob[]
} {
  return {
    results: jobs.flatMap((job) =>
      isMinimalData
        ? transformLbaJobWithMinimalData({
            recruiter: job,
            applicationCountByJob,
          })
        : transformLbaJob({
            recruiter: job,
            applicationCountByJob,
          })
    ),
  }
}

/**
 * @description Retourne une offre LBA identifiée par son id
 */
export const getLbaJobById = async ({ id, caller }: { id: ObjectId; caller?: string }): Promise<IApiError | { matchas: ILbaItemLbaJob[] }> => {
  try {
    const rawJob = await getOffreAvecInfoMandataire(id)

    if (!rawJob) {
      return { error: "not_found" }
    }

    const applicationCountByJob = await getApplicationByJobCount([id.toString()])

    const job = transformLbaJob({
      recruiter: rawJob.recruiter,
      applicationCountByJob,
    })

    if (caller) {
      trackApiCall({ caller: caller, job_count: 1, result_count: 1, api_path: "jobV1/matcha", response: "OK" })
    }

    return { matchas: job }
  } catch (error) {
    sentryCaptureException(error)
    return manageApiError({ error, api_path: "jobV1/matcha", caller, errorTitle: "getting job by id from Matcha" })
  }
}

/**
 * @description Retourne une offre LBA identifiée par son id
 */
export const getLbaJobByIdV2 = async ({ id, caller }: { id: string; caller?: string }): Promise<{ job: ILbaItemLbaJob[] } | null> => {
  try {
    const rawJob = await getOffreAvecInfoMandataire(id)

    if (!rawJob) {
      throw badRequest()
    }

    const applicationCountByJob = await getApplicationByJobCount([id])

    const job = transformLbaJob({
      recruiter: rawJob.recruiter,
      applicationCountByJob,
    })

    if (caller) {
      trackApiCall({ caller: caller, job_count: 1, result_count: 1, api_path: "job/offre_emploi_lba", response: "OK" })
    }

    return { job }
  } catch (error) {
    sentryCaptureException(error)
    return null
  }
}

const getCity = (recruiter) => {
  let city = ""
  if (recruiter.establishment_location) {
    // cas mandataire
    city = recruiter.establishment_location
  } else if (recruiter.address_detail && "localite" in recruiter.address_detail) {
    city = recruiter.address_detail.localite
  } else if (recruiter.address_detail && "libelle_commune" in recruiter.address_detail) {
    city = recruiter.address_detail.libelle_commune
  }

  return city
}

const getNumberAndStreet = (addressDetail: IRecruiter["address_detail"]): string | null => {
  const numero_voie = addressDetail?.numero_voie
  const indice_repetition_voie = addressDetail?.indice_repetition_voie
  const type_voie = addressDetail?.type_voie
  const libelle_voie = addressDetail?.libelle_voie
  return [numero_voie, indice_repetition_voie, type_voie, libelle_voie].flatMap((x) => (x ? [x] : [])).join(" ") || null
}

/**
 * Adaptation au modèle LBAC et conservation des seules infos utilisées de l'offre
 */
function transformLbaJob({ recruiter, applicationCountByJob }: { recruiter: Partial<IRecruiter>; applicationCountByJob: IApplicationCount[] }): ILbaItemLbaJob[] {
  if (!recruiter.jobs) {
    return []
  }

  return recruiter.jobs.map((offre): ILbaItemLbaJob => {
    const email = encryptMailWithIV({ value: recruiter.email })
    const applicationCountForCurrentJob = applicationCountByJob.find((job) => job._id.toString() === offre._id.toString())
    const romes = offre.rome_code.map((code) => ({ code, label: null }))

    const latitude = recruiter?.geopoint?.coordinates[1] ?? 0
    const longitude = recruiter?.geopoint?.coordinates[0] ?? 0

    const resultJob: ILbaItemLbaJob = {
      ideaType: LBA_ITEM_TYPE_OLD.MATCHA,
      // ideaType: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA,
      id: offre._id.toString(),
      title: offre.rome_appellation_label ?? offre.rome_label,
      contact: {
        ...email,
        name: recruiter.first_name + " " + recruiter.last_name,
        phone: recruiter.phone,
      },
      place: {
        //lieu de l'offre. contient ville de l'entreprise et geoloc de l'entreprise
        distance: recruiter.distance ?? false ? roundDistance((recruiter?.distance ?? 0) / 1000) : null,
        fullAddress: recruiter.is_delegated ? null : recruiter.address,
        address: recruiter.is_delegated ? null : recruiter.address,
        numberAndStreet: recruiter.is_delegated ? null : getNumberAndStreet(recruiter.address_detail),
        latitude,
        longitude,
        city: getCity(recruiter),
        zipCode: recruiter?.address_detail?.code_postal,
      },
      company: {
        // si mandataire contient les données du CFA
        siret: recruiter.establishment_siret,
        name: recruiter.establishment_enseigne || recruiter.establishment_raison_sociale || "Enseigne inconnue",
        size: recruiter.establishment_size,
        mandataire: recruiter.is_delegated,
        creationDate: recruiter.establishment_creation_date ? new Date(recruiter.establishment_creation_date) : null,
        place: recruiter.is_delegated
          ? {
              // contient infos d'adresse du cfa mandataire
              address: recruiter.address,
              fullAddress: recruiter.address,
            }
          : null,
      },
      nafs: [{ label: recruiter.naf_label }],
      target_diploma_level: offre.job_level_label || null,
      job: {
        id: offre._id.toString(),
        description: offre.job_description && offre.job_description.length > 50 ? offre.job_description : null,
        employeurDescription: offre.job_employer_description || null,
        creationDate: offre.job_creation_date ? new Date(offre.job_creation_date) : null,
        contractType: offre.job_type ? offre.job_type.join(", ") : null,
        jobStartDate: offre.job_start_date ? new Date(offre.job_start_date) : null,
        jobExpirationDate: offre.job_expiration_date ? new Date(offre.job_expiration_date) : null,
        romeDetails: offre.rome_detail ? { ...offre.rome_detail, competences: offre?.competences_rome ?? offre.rome_detail?.competences } : null,
        rythmeAlternance: offre.job_rythm || null,
        dureeContrat: "" + offre.job_duration,
        quantiteContrat: offre.job_count,
        elligibleHandicap: offre.is_disabled_elligible,
        status: recruiter.status === RECRUITER_STATUS.ACTIF && offre.job_status === JOB_STATUS.ACTIVE ? JOB_STATUS.ACTIVE : JOB_STATUS.ANNULEE,
        type: offre.job_type?.length ? offre.job_type : null,
      },
      romes,
      applicationCount: applicationCountForCurrentJob?.count || 0,
      token: generateApplicationToken({ jobId: offre._id.toString() }),
    }

    //TODO: remove when 1j1s switch to api V2
    if (resultJob?.job?.romeDetails) {
      resultJob.job.romeDetails.competencesDeBase = resultJob.job.romeDetails?.competences?.savoir_faire
    }

    return resultJob
  })
}

/**
 * Adaptation au modèle LBAC et conservation des seules infos utilisées de l'offre
 */
function transformLbaJobWithMinimalData({ recruiter, applicationCountByJob }: { recruiter: Partial<IRecruiter>; applicationCountByJob: IApplicationCount[] }): ILbaItemLbaJob[] {
  if (!recruiter.jobs) {
    return []
  }

  return recruiter.jobs.map((offre): ILbaItemLbaJob => {
    const applicationCountForCurrentJob = applicationCountByJob.find((job) => job._id.toString() === offre._id.toString())

    const latitude = recruiter?.geopoint?.coordinates[1] ?? 0
    const longitude = recruiter?.geopoint?.coordinates[0] ?? 0

    const resultJob: ILbaItemLbaJob = {
      ideaType: LBA_ITEM_TYPE_OLD.MATCHA,
      // ideaType: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA,
      id: offre._id.toString(),
      title: offre.rome_appellation_label ?? offre.rome_label,
      place: {
        //lieu de l'offre. contient ville de l'entreprise et geoloc de l'entreprise
        distance: recruiter.distance ?? false ? roundDistance((recruiter?.distance ?? 0) / 1000) : null,
        fullAddress: recruiter.is_delegated ? null : recruiter.address,
        address: recruiter.is_delegated ? null : recruiter.address,
        latitude,
        longitude,
        city: getCity(recruiter),
      },
      company: {
        // si mandataire contient les données du CFA
        siret: recruiter.establishment_siret,
        name: recruiter.establishment_enseigne || recruiter.establishment_raison_sociale || "Enseigne inconnue",
        mandataire: recruiter.is_delegated,
      },
      job: {
        creationDate: offre.job_creation_date ? new Date(offre.job_creation_date) : null,
      },
      applicationCount: applicationCountForCurrentJob?.count || 0,
      token: generateApplicationToken({ jobId: offre._id.toString() }),
    }

    return resultJob
  })
}

/**
 * tri des ofres selon l'ordre alphabétique du titre (primaire) puis du nom de société (secondaire)
 */
export function sortLbaJobs(jobs: Partial<ILbaItemLbaJob | ILbaItemPartnerJob>[]) {
  jobs.sort((a, b) => {
    if (a && b) {
      if (a.title && b.title) {
        if (a?.title?.toLowerCase() < b?.title?.toLowerCase()) {
          return -1
        }
        if (a?.title?.toLowerCase() > b?.title?.toLowerCase()) {
          return 1
        }
      }

      if (a.company?.name && b.company?.name) {
        if (a?.company?.name?.toLowerCase() < b?.company?.name?.toLowerCase()) {
          return -1
        }
        if (a?.company?.name?.toLowerCase() > b?.company?.name?.toLowerCase()) {
          return 1
        }
      }
    }

    return 0
  })
}

/**
 * @description Incrémente le compteur de vue de la page de détail d'une offre LBA
 */
export const addOffreDetailView = async (jobId: IJob["_id"] | string) => {
  try {
    await getDbCollection("recruiters").updateOne(
      { "jobs._id": jobId },
      {
        $inc: {
          "jobs.$[elem].stats_detail_view": 1,
        },
      },
      { arrayFilters: [{ "elem._id": jobId }] }
    )
  } catch (err) {
    sentryCaptureException(err)
  }
}

/**
 * @description Incrémente les compteurs de vue d'un ensemble d'offres lba
 */
export const incrementLbaJobsViewCount = async (jobIds: string[]) => {
  const ids = jobIds.map((id) => new ObjectId(id))
  try {
    await getDbCollection("recruiters").updateMany(
      { "jobs._id": { $in: ids } },
      {
        $inc: {
          "jobs.$[elem].stats_search_view": 1,
        },
      },
      { arrayFilters: [{ "elem._id": { $in: ids } }] }
    )
  } catch (err) {
    sentryCaptureException(err)
  }
}

const getLbaJobContactInfo = async (recruiter: IJobResult["recruiter"]): Promise<Partial<IJobResult["recruiter"]>> => {
  if (recruiter.is_delegated && recruiter.cfa_delegated_siret) {
    const { managed_by } = recruiter
    if (!managed_by) {
      throw internal(`managed_by est manquant pour le recruiter avec id=${recruiter._id}`)
    }

    const [cfa, cfaUser] = await Promise.all([
      getDbCollection("cfas").findOne({ siret: recruiter.cfa_delegated_siret }),
      getDbCollection("userswithaccounts").findOne({ _id: new ObjectId(managed_by) }),
    ])

    if (!cfa) {
      throw internal(`inattendu: cfa introuvable avec le siret ${recruiter.cfa_delegated_siret}`)
    }
    if (!cfaUser) {
      throw internal(`le user cfa est introuvable pour le recruiter avec id=${recruiter._id}`)
    }

    return {
      phone: cfaUser.phone,
      email: cfaUser.email,
      last_name: cfaUser.last_name,
      first_name: cfaUser.first_name,
      establishment_raison_sociale: cfa.raison_sociale,
      establishment_enseigne: cfa.enseigne,
      establishment_siret: cfa.siret,
      address: cfa.address,
    }
  }

  return {}
}

export const replaceRecruiterFieldsWithCfaFields = async (recruiter: IRecruiter) => {
  if (recruiter.is_delegated && recruiter.cfa_delegated_siret) {
    Object.assign(recruiter, await getLbaJobContactInfo(recruiter))
  }
}
