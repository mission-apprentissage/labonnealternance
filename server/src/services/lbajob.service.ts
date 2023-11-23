import { IJob, IRecruiter, JOB_STATUS } from "shared"

import { Recruiter } from "@/common/model"

import { search } from "../common/esClient/index"
import { encryptMailWithIV } from "../common/utils/encryptString"
import { IApiError, manageApiError } from "../common/utils/errorManager"
import { roundDistance } from "../common/utils/geolib"
import { trackApiCall } from "../common/utils/sendTrackingEvent"
import { sentryCaptureException } from "../common/utils/sentryUtils"

import { IApplicationCount, getApplicationByJobCount } from "./application.service"
import { ACTIVE, NIVEAUX_POUR_LBA, RECRUITER_STATUS } from "./constant.service"
import { getEtablissement } from "./etablissement.service"
import { getOffreAvecInfoMandataire, incrementLbaJobViewCount } from "./formulaire.service"
import { ILbaItemLbaJob } from "./lbaitem.shared.service.types"
import { ILbaJobEsResult } from "./lbajob.service.types"
import { filterJobsByOpco } from "./opco.service"

const JOB_SEARCH_LIMIT = 250

const coordinatesOfFrance = [2.213749, 46.227638]

/**
 * @description get filtered jobs from elastic search index
 * @param {Object} payload
 * @param {number} payload.distance
 * @param {string} payload.lat
 * @param {string} payload.long
 * @param {string[]} payload.romes
 * @param {string} payload.niveau
 * @returns {Promise<ILbaJobEsResult[]>}
 */
export const getJobsFromElasticSearch = async ({
  distance,
  lat,
  lon,
  romes,
  niveau,
}: {
  distance: number
  lat: string
  lon: string
  romes: string[]
  niveau: string
}): Promise<ILbaJobEsResult[]> => {
  const filter: Array<object> = [
    {
      geo_distance: {
        distance: `${distance}km`,
        geo_coordinates: {
          lat,
          lon,
        },
      },
    },
  ]

  if (niveau && niveau !== "Indifférent") {
    filter.push({
      nested: {
        path: "jobs",
        query: {
          bool: {
            should: [
              {
                match_phrase: {
                  "jobs.job_level_label": niveau,
                },
              },
              {
                match_phrase: {
                  "jobs.job_level_label": NIVEAUX_POUR_LBA["INDIFFERENT"],
                },
              },
            ],
          },
        },
      },
    })
  }

  const body = {
    query: {
      bool: {
        must: [
          {
            nested: {
              path: "jobs",
              query: {
                bool: {
                  must: [
                    {
                      match: {
                        "jobs.rome_code": romes.join(" "),
                      },
                    },
                    {
                      match: {
                        "jobs.job_status": ACTIVE,
                      },
                    },
                  ],
                },
              },
            },
          },
          {
            match: {
              status: "Actif",
            },
          },
        ],
        filter: filter,
      },
    },
    sort: [
      {
        _geo_distance: {
          geo_coordinates: {
            lat,
            lon,
          },
          order: "asc",
          unit: "km",
          mode: "min",
          distance_type: "arc",
          ignore_unmapped: true,
        },
      },
    ],
  }

  const result = await search({ size: JOB_SEARCH_LIMIT, index: "recruiters", body }, Recruiter)

  const filteredJobs = await Promise.all(
    result.map(async (x) => {
      const jobs: any[] = []

      if (x._source.jobs.length === 0) {
        return
      }

      if (x._source.is_delegated) {
        const [establishment_location] = x._source.address.match(/([0-9]{5})[ ,] ?([a-zA-Z-]*)/) ?? [""]
        const cfa = await getEtablissement({ establishment_siret: x._source.cfa_delegated_siret })

        x._source.phone = cfa?.phone
        x._source.email = cfa?.email
        x._source.last_name = cfa?.last_name
        x._source.first_name = cfa?.first_name
        x._source.establishment_raison_sociale = cfa?.establishment_raison_sociale
        x._source.address = cfa?.address
        x._source.establishment_location = establishment_location
      }

      x._source.jobs.forEach((o) => {
        if (romes.some((item) => o.rome_code.includes(item)) && o.job_status === JOB_STATUS.ACTIVE) {
          o.rome_label = o.rome_appellation_label ?? o.rome_label
          if (!niveau || NIVEAUX_POUR_LBA["INDIFFERENT"] === o.job_level_label || niveau === o.job_level_label) {
            jobs.push(o)
          }
        }
      })

      x._source.jobs = jobs
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

    const jobs = await getJobsFromElasticSearch(params)

    const ids: string[] = jobs.flatMap(({ _source }) => (_source?.jobs ? _source.jobs.map(({ _id }) => _id.toString()) : []))

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
    return manageApiError({ error, api_path: api, caller, errorTitle: `getting jobs from Matcha (${api})` })
  }
}

/**
 * Converti les offres issues de l'elasticsearch ou de la mongo en objet de type ILbaItem
 */
function transformLbaJobs({ jobs, applicationCountByJob }: { jobs: ILbaJobEsResult[]; applicationCountByJob: IApplicationCount[] }): {
  results: ILbaItemLbaJob[]
} {
  return {
    results: jobs.flatMap((job) =>
      transformLbaJob({
        recruiter: job._source,
        distance: job.sort ? job.sort[0] : undefined,
        applicationCountByJob,
      })
    ),
  }
}

/**
 * Retourne une offre LBA identifiée par son id
 */
export const getLbaJobById = async ({ id, caller }: { id: string; caller?: string }): Promise<IApiError | { matchas: ILbaItemLbaJob[] }> => {
  try {
    const rawJob = await getOffreAvecInfoMandataire(id)

    if (!rawJob) {
      return { error: "not_found" }
    }

    const applicationCountByJob = await getApplicationByJobCount([id])

    const job = transformLbaJob({
      recruiter: rawJob,
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

const getCity = (recruiter) => {
  let city = ""
  if (recruiter.establishment_location) {
    // cas mandataire
    city = recruiter.establishment_location
  } else if ("localite" in recruiter.address_detail) {
    city = recruiter.address_detail.localite
  } else if ("libelle_commune" in recruiter.address_detail) {
    city = recruiter.address_detail.libelle_commune
  }

  return city
}

/**
 * Adaptation au modèle LBAC et conservation des seules infos utilisées de l'offre
 */
function transformLbaJob({
  recruiter,
  distance,
  applicationCountByJob,
}: {
  recruiter: Partial<IRecruiter>
  distance?: number
  applicationCountByJob: IApplicationCount[]
}): ILbaItemLbaJob[] {
  if (!recruiter.jobs) {
    return []
  }

  return recruiter.jobs.map((offre, idx): ILbaItemLbaJob => {
    const email = encryptMailWithIV({ value: recruiter.email })
    const applicationCountForCurrentJob = applicationCountByJob.find((job) => job._id.toString() === offre._id.toString())
    const romes = offre.rome_code.map((code) => ({ code, label: null }))

    const latitude = parseFloat(recruiter.geo_coordinates ? recruiter.geo_coordinates.split(",")[0] : "0")
    const longitude = parseFloat(recruiter.geo_coordinates ? recruiter.geo_coordinates.split(",")[1] : "0")

    const resultJob: ILbaItemLbaJob = {
      ideaType: "matcha",
      id: `${recruiter.establishment_id}-${idx}`,
      title: offre.rome_appellation_label ?? offre.rome_label,
      contact: {
        ...email,
        name: recruiter.first_name + " " + recruiter.last_name,
        phone: recruiter.phone,
      },
      place: {
        //lieu de l'offre. contient ville de l'entreprise et geoloc de l'entreprise
        distance: distance !== undefined ? roundDistance(distance) : null,
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
        romeDetails: offre.rome_detail,
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
 * Incrémente le compteur de vue de la page de détail d'une offre LBA
 * @param {string} jobId
 */
export const addOffreDetailView = async (jobId: IJob["_id"] | string) => {
  await incrementLbaJobViewCount(jobId, {
    stats_detail_view: 1,
  })
}

/**
 * Incrémente le compteur de vue de la page de recherche d'une offre LBA
 */
export const addOffreSearchView = async (jobId: IJob["_id"] | string) => {
  try {
    await incrementLbaJobViewCount(jobId, {
      stats_search_view: 1,
    })
  } catch (err) {
    sentryCaptureException(err)
  }
}
