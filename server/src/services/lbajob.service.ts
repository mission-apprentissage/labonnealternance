import Boom from "boom"
import pkg from "mongodb"
import { IJob, IRecruiter, JOB_STATUS } from "shared"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"
import { RECRUITER_STATUS } from "shared/constants/recruteur"

import { Recruiter } from "@/common/model"
import { db } from "@/common/mongodb"

import { encryptMailWithIV } from "../common/utils/encryptString"
import { IApiError, manageApiError } from "../common/utils/errorManager"
import { roundDistance } from "../common/utils/geolib"
import { trackApiCall } from "../common/utils/sendTrackingEvent"
import { sentryCaptureException } from "../common/utils/sentryUtils"

import { IApplicationCount, getApplicationByJobCount } from "./application.service"
import { NIVEAUX_POUR_LBA } from "./constant.service"
import { getEtablissement } from "./etablissement.service"
import { getOffreAvecInfoMandataire } from "./formulaire.service"
import { ILbaItemLbaJob } from "./lbaitem.shared.service.types"
import { filterJobsByOpco } from "./opco.service"

const { ObjectId } = pkg

const JOB_SEARCH_LIMIT = 250

const coordinatesOfFrance = [2.213749, 46.227638]

/**
 * @description get filtered jobs from mongo
 * @param {Object} payload
 * @param {number} payload.distance
 * @param {string} payload.lat
 * @param {string} payload.long
 * @param {string[]} payload.romes
 * @param {string} payload.niveau
 * @returns {Promise<IRecruiter[]>}
 */
export const getJobs = async ({ distance, lat, lon, romes, niveau }: { distance: number; lat: string; lon: string; romes: string[]; niveau: string }): Promise<IRecruiter[]> => {
  const clauses: any[] = [{ "jobs.job_status": JOB_STATUS.ACTIVE }, { "jobs.rome_code": { $in: romes } }, { status: RECRUITER_STATUS.ACTIF }]

  if (niveau && niveau !== "Indifférent") {
    clauses.push({
      $or: [
        {
          "jobs.job_level_label": niveau,
        },
        {
          "jobs.job_level_label": NIVEAUX_POUR_LBA["INDIFFERENT"],
        },
      ],
    })
  }

  const stages: any[] = [
    {
      $limit: JOB_SEARCH_LIMIT,
    },
  ]

  const query: any = { $and: clauses }

  stages.unshift({
    $geoNear: {
      near: { type: "Point", coordinates: [lon, lat] },
      distanceField: "distance",
      maxDistance: distance * 1000,
      query,
    },
  })

  const jobs: IRecruiter[] = await Recruiter.aggregate(stages)

  const filteredJobs = await Promise.all(
    jobs.map(async (x) => {
      const jobs: any[] = []

      if (x.is_delegated) {
        const cfa = await getEtablissement({ establishment_siret: x.cfa_delegated_siret })

        x.phone = cfa?.phone
        x.email = cfa?.email || ""
        x.last_name = cfa?.last_name
        x.first_name = cfa?.first_name
        x.establishment_raison_sociale = cfa?.establishment_raison_sociale
        x.address = cfa?.address
      }

      x.jobs.forEach((o) => {
        if (romes.some((item) => o.rome_code.includes(item)) && o.job_status === JOB_STATUS.ACTIVE) {
          o.rome_label = o.rome_appellation_label ?? o.rome_label
          if (!niveau || NIVEAUX_POUR_LBA["INDIFFERENT"] === o.job_level_label || niveau === o.job_level_label) {
            jobs.push(o)
          }
        }
      })

      x.jobs = jobs
      return x
    })
  )

  return filteredJobs
}

/**
 * Retourne les offres LBA correspondantes aux critères de recherche
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
}) => {
  if (radius === 0) {
    radius = 10
  }
  try {
    const hasLocation = Boolean(latitude)

    const distance = hasLocation ? radius : 21000

    const params: any = {
      romes: romes?.split(","),
      distance,
      lat: hasLocation ? latitude : coordinatesOfFrance[1],
      lon: hasLocation ? longitude : coordinatesOfFrance[0],
    }

    if (diploma) {
      params.niveau = NIVEAUX_POUR_LBA[diploma]
    }

    const jobs = await getJobs(params)

    const ids: string[] = jobs.flatMap((recruiter) => (recruiter?.jobs ? recruiter.jobs.map(({ _id }) => _id.toString()) : []))

    const applicationCountByJob = await getApplicationByJobCount(ids)

    const matchas = transformLbaJobs({ jobs, applicationCountByJob })

    // filtrage sur l'opco
    if (opco || opcoUrl) {
      matchas.results = await filterJobsByOpco({ opco, opcoUrl, jobs: matchas.results })
    }

    if (!hasLocation && matchas.results) {
      sortLbaJobs(matchas)
    }

    return matchas
  } catch (error) {
    sentryCaptureException(error)
    return manageApiError({ error, api_path: api, caller, errorTitle: `getting jobs from Matcha (${api})` })
  }
}

/**
 * Converti les offres issues de la mongo en objet de type ILbaItem
 */
function transformLbaJobs({ jobs, applicationCountByJob }: { jobs: IRecruiter[]; applicationCountByJob: IApplicationCount[] }): {
  results: ILbaItemLbaJob[]
} {
  return {
    results: jobs.flatMap((job) =>
      transformLbaJob({
        recruiter: job,
        applicationCountByJob,
      })
    ),
  }
}

/**
 * @description Retourne une offre LBA identifiée par son id
 */
export const getLbaJobById = async ({ id, caller }: { id: string; caller?: string }): Promise<IApiError | { matchas: ILbaItemLbaJob[] }> => {
  try {
    const rawJob = await getOffreAvecInfoMandataire(id)

    if (!rawJob) {
      return { error: "not_found" }
    }

    const applicationCountByJob = await getApplicationByJobCount([id])

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
      throw Boom.badRequest()
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

/**
 * Adaptation au modèle LBAC et conservation des seules infos utilisées de l'offre
 */
function transformLbaJob({ recruiter, applicationCountByJob }: { recruiter: Partial<IRecruiter>; applicationCountByJob: IApplicationCount[] }): ILbaItemLbaJob[] {
  if (!recruiter.jobs) {
    return []
  }

  return recruiter.jobs.map((offre, idx): ILbaItemLbaJob => {
    const email = encryptMailWithIV({ value: recruiter.email })
    const applicationCountForCurrentJob = applicationCountByJob.find((job) => job._id.toString() === offre._id.toString())
    const romes = offre.rome_code.map((code) => ({ code, label: null }))

    const latitude = recruiter?.geopoint?.coordinates[1] ?? 0
    const longitude = recruiter?.geopoint?.coordinates[0] ?? 0

    const resultJob: ILbaItemLbaJob = {
      ideaType: LBA_ITEM_TYPE_OLD.MATCHA,
      // ideaType: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA,
      id: `${recruiter.establishment_id}-${idx}`,
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
        latitude,
        longitude,
        city: getCity(recruiter),
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
      diplomaLevel: offre.job_level_label || null,
      job: {
        id: offre._id.toString(),
        description: offre.job_description && offre.job_description.length > 50 ? offre.job_description : null,
        employeurDescription: offre.job_employer_description || null,
        creationDate: offre.job_creation_date ? new Date(offre.job_creation_date) : null,
        contractType: offre.job_type ? offre.job_type.join(", ") : null,
        jobStartDate: offre.job_start_date ? new Date(offre.job_start_date) : null,
        // KBA 20231123 - remove ROME for all PASS jobs until they use it.
        romeDetails: recruiter.opco === "pass" ? null : offre.rome_detail,
        rythmeAlternance: offre.job_rythm || null,
        dureeContrat: "" + offre.job_duration,
        quantiteContrat: offre.job_count,
        elligibleHandicap: offre.is_disabled_elligible,
        status: recruiter.status === RECRUITER_STATUS.ACTIF && offre.job_status === JOB_STATUS.ACTIVE ? JOB_STATUS.ACTIVE : JOB_STATUS.ANNULEE,
      },
      romes,
      applicationCount: applicationCountForCurrentJob?.count || 0,
    }

    return resultJob
  })
}

/**
 * tri des ofres selon l'ordre alphabétique du titre (primaire) puis du nom de société (secondaire)
 */
function sortLbaJobs(jobs: { results: ILbaItemLbaJob[] }) {
  jobs.results.sort((a, b) => {
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
    await db.collection("recruiters").updateOne(
      { "jobs._id": jobId },
      {
        $inc: {
          "jobs.$.stats_detail_view": 1,
        },
      }
    )
  } catch (err) {
    sentryCaptureException(err)
  }
}

/**
 * @description Incrémente les compteurs de vue d'un ensemble d'offres lba
 */
export const incrementLbaJobsViewCount = async (lbaJobs) => {
  const ids = lbaJobs.results.map((job) => new ObjectId(job.job.id))
  try {
    await db.collection("recruiters").updateMany(
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
