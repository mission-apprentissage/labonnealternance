import { IRecruiter } from "shared"

import { encryptMailWithIV } from "../common/utils/encryptString"
import { IApiError, manageApiError } from "../common/utils/errorManager"
import { roundDistance } from "../common/utils/geolib"
import { trackApiCall } from "../common/utils/sendTrackingEvent"

import { IApplicationCount, getApplicationByJobCount } from "./application.service"
import { JOB_STATUS, NIVEAUX_POUR_LBA, RECRUITER_STATUS } from "./constant.service"
import { getJobsFromElasticSearch, getOffreAvecInfoMandataire, incrementLbaJobViewCount } from "./formulaire.service"
import type { TLbaItemResult } from "./jobOpportunity.service.types"
import type { ILbaItem } from "./lbaitem.shared.service.types"
import type { ILbaJobEsResult } from "./lbajob.service.types"
import { filterJobsByOpco } from "./opco.service"

const coordinatesOfFrance = [2.213749, 46.227638]

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
  caller?: string
}): Promise<TLbaItemResult> => {
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

    const jobs = await getJobsFromElasticSearch(params)

    const ids: string[] = jobs.flatMap(({ _source }) => (_source?.jobs ? _source.jobs.map(({ _id }) => _id.toString()) : []))

    const applicationCountByJob = await getApplicationByJobCount(ids)

    const matchas = transformLbaJobs({ jobs, caller, applicationCountByJob })

    // filtrage sur l'opco
    if (opco || opcoUrl) {
      matchas.results = await filterJobsByOpco({ opco, opcoUrl, jobs: matchas.results })
    }

    if (!hasLocation) {
      sortLbaJobs(matchas)
    }

    return matchas
  } catch (error) {
    return manageApiError({ error, api_path: api, caller, errorTitle: `getting jobs from Matcha (${api})` })
  }
}

/**
 * Converti les offres issues de l'elasticsearch ou de la mongo en objet de type ILbaItem
 * @param {ILbaJobEsResult[]} jobs offres issues de l'elasticsearch ou de la mogon
 * @param {string} caller l'identifiant de l'utilisateur de l'api
 * @param {IApplicationCount[]} applicationCountByJob les décomptes de candidatures par identifiant d'offres
 * @returns {{ results: ILbaItem[] }}
 */
function transformLbaJobs({ jobs, caller, applicationCountByJob }: { jobs: ILbaJobEsResult[]; caller?: string; applicationCountByJob: IApplicationCount[] }): {
  results: ILbaItem[]
} {
  return {
    results: jobs.flatMap((job) =>
      transformLbaJob({
        job: job._source,
        distance: job.sort[0],
        applicationCountByJob,
        caller,
      })
    ),
  }
}

/**
 * Retourne une offre LBA identifiée par son id
 * @param {string} id l'identifiant mongo de l'offre LBA
 * @param {string} caller optionnel. l'identifiant de l'utilisateur de l'api
 * @return {Promise<IApiError | { matchas: ILbaItem[] }>}
 */
export const getLbaJobById = async ({ id, caller }: { id: string; caller?: string }): Promise<IApiError | { matchas: ILbaItem[] }> => {
  try {
    const rawJob = await getOffreAvecInfoMandataire(id)

    if (!rawJob) {
      return { error: "not_found" }
    }

    const applicationCountByJob = await getApplicationByJobCount([id])

    const job = transformLbaJob({
      job: rawJob,
      caller,
      applicationCountByJob,
    })

    if (caller) {
      trackApiCall({ caller: caller, job_count: 1, result_count: 1, api_path: "jobV1/matcha", response: "OK" })
    }

    return { matchas: job }
  } catch (error) {
    return manageApiError({ error, api_path: "jobV1/matcha", caller, errorTitle: "getting job by id from Matcha" })
  }
}

/**
 * Adaptation au modèle LBAC et conservation des seules infos utilisées de l'offre
 * @param {Partial<IRecruiter>} job l'offre retournée d'ES ou de la mongo
 * @param {number} distance optionnel: la distance du lieu de l'offre au centre de la recherche
 * @param {string} caller optionnel: l'id de l'utilisateur de l'api
 * @param {IApplicationCount[]} applicationCountByJob le tableau des décomptes de candidatures par offre
 * @returns {ILbaItem[]}
 */
function transformLbaJob({
  job,
  distance,
  caller,
  applicationCountByJob,
}: {
  job: Partial<IRecruiter>
  distance?: number
  caller?: string
  applicationCountByJob: IApplicationCount[]
}) {
  return job.jobs
    ? job.jobs.map((offre, idx) => {
        const email = encryptMailWithIV({ value: job.email, caller })
        const applicationCount = applicationCountByJob.find((job) => job._id.toString() === offre._id.toString())
        const romes = offre.rome_code.map((code) => ({ code, label: null }))

        const resultJob = {
          ideaType: "matcha",
          id: `${job.establishment_id}-${idx}`,
          title: offre.rome_appellation_label ?? offre.rome_label,
          contact: {
            ...email,
            name: job.first_name + " " + job.last_name,
            phone: job.phone,
          },
          place: {
            distance: distance ? roundDistance(distance) : null,
            fullAddress: job.address,
            address: job.address,
            latitude: job.geo_coordinates && job.geo_coordinates.split(",")[0],
            longitude: job.geo_coordinates && job.geo_coordinates.split(",")[1],
            city: job.address_detail && "localite" in job.address_detail && job.address_detail.localite,
          },
          company: {
            siret: job.establishment_siret,
            name: job.establishment_enseigne || job.establishment_raison_sociale || "Enseigne inconnue",
            size: job.establishment_size,
            mandataire: job.is_delegated,
            creationDate: job.establishment_creation_date && new Date(job.establishment_creation_date),
          },
          nafs: [{ label: job.naf_label }],
          diplomaLevel: offre.job_level_label,
          // createdAt: job.createdAt,
          // lastUpdateAt: job.updatedAt,
          job: {
            id: offre._id,
            description: offre.job_description || "",
            creationDate: offre.job_creation_date,
            contractType: offre.job_type && offre.job_type.join(", "),
            jobStartDate: offre.job_start_date,
            romeDetails: offre.rome_detail,
            rythmeAlternance: offre.job_rythm || null,
            dureeContrat: "" + offre.job_duration,
            quantiteContrat: offre.job_count,
            elligibleHandicap: offre.is_disabled_elligible,
            status: job.status === RECRUITER_STATUS.ACTIF && offre.job_status === JOB_STATUS.ACTIVE ? JOB_STATUS.ACTIVE : JOB_STATUS.ANNULEE,
          },
          romes,
          idRco: null,
          idRcoFormation: null,
          url: null,
          cleMinistereEducatif: null,
          diploma: null,
          cfd: null,
          rncpCode: null,
          rncpLabel: null,
          rncpEligibleApprentissage: null,
          period: null,
          capacity: null,
          onisepUrl: null,
          training: null,
          applicationCount,
        }

        return resultJob
      })
    : []
}

/**
 * tri des ofres selon l'ordre alphabétique du titre (primaire) puis du nom de société (secondaire)
 * @param {{ results: ILbaItem[] }}
 */
function sortLbaJobs(jobs: { results: ILbaItem[] }) {
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
 * Incrémente le compteur de vue de la page de détail d'une offre LBA
 * @param {string} jobId
 */
export const addOffreDetailView = async (jobId: string) => {
  await incrementLbaJobViewCount(jobId, {
    stats_detail_view: 1,
  })
}

/**
 * Incrémente le compteur de vue de la page de recherche d'une offre LBA
 * @param {string} jobId
 */
export const addOffreSearchView = async (jobId: string) => {
  await incrementLbaJobViewCount(jobId, {
    stats_search_view: 1,
  })
}
