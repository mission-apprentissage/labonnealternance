// @ts-nocheck
import { encryptMailWithIV } from "../common/utils/encryptString.js"
import { IApiError, manageApiError } from "../common/utils/errorManager.js"
import { trackApiCall } from "../common/utils/sendTrackingEvent.js"
import { itemModel } from "../model/itemModel.js"
import { filterJobsByOpco } from "./opco.service.js"

const coordinatesOfFrance = [2.213749, 46.227638]

import { NIVEAUX_POUR_LBA } from "../common/constants.js"
import { roundDistance } from "../common/geolib.js"
import { matchaMock, matchaMockMandataire, matchasMock } from "../mocks/matchas-mock.js"
import { getOffreAvecInfoMandataire, getJobsFromElasticSearch } from "./formulaire.service.js"
import { getApplicationByJobCount } from "./application.service.js"

export const getLbaJobs = async ({ romes, radius, latitude, longitude, api, opco, opcoUrl, diploma, caller, useMock }) => {
  try {
    const hasLocation = latitude === "" || latitude === undefined ? false : true

    const distance = hasLocation ? radius || 10 : 21000

    const params = {
      romes: romes.split(","),
      distance,
      lat: hasLocation ? latitude : coordinatesOfFrance[1],
      lon: hasLocation ? longitude : coordinatesOfFrance[0],
    }

    if (diploma) {
      params.niveau = NIVEAUX_POUR_LBA[diploma]
    }

    const jobs = useMock === "true" ? matchasMock : await getJobsFromElasticSearch(params)

    const ids = jobs.map(({ _source }) => _source.jobs.map(({ _id }) => _id)).flat()

    const matchaApplicationCountByJob = await getApplicationByJobCount(ids)

    const matchas = transformLbaJobs({ jobs, caller, matchaApplicationCountByJob })

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

// update du contenu avec des résultats pertinents par rapport au rayon
const transformLbaJobs = ({ jobs, caller, matchaApplicationCountByJob }) => {
  const resultJobs = {
    results: [],
  }

  if (jobs && jobs.length) {
    for (let i = 0; i < jobs.length; ++i) {
      const companyJobs = transformLbaJob({
        job: jobs[i]._source,
        distance: jobs[i].sort[0],
        matchaApplicationCountByJob,
        caller,
      })
      companyJobs.map((job) => resultJobs.results.push(job))
    }
  }

  return resultJobs
}

export const getLbaJobById = async ({ id, caller }): IApiError | { matchas: ILbaItem[] } => {
  try {
    let jobs = null
    if (id === "id-matcha-test") {
      jobs = matchaMock._source
    } else if (id === "id-matcha-test2") {
      jobs = matchaMockMandataire._source
    } else {
      jobs = await getOffreAvecInfoMandataire(id)
    }

    const matchaApplicationCountByJob = await getApplicationByJobCount([id])

    const job = transformLbaJob({
      job: jobs,
      caller,
      matchaApplicationCountByJob,
    })

    if (caller) {
      trackApiCall({ caller: caller, job_count: 1, result_count: 1, api_path: "jobV1/matcha", response: "OK" })
    }

    return { matchas: job }
  } catch (error) {
    return manageApiError({ error, api_path: "jobV1/matcha", caller, errorTitle: "getting job by id from Matcha" })
  }
}

// Adaptation au modèle Idea et conservation des seules infos utilisées des offres
const transformLbaJob = ({ job, distance, caller, matchaApplicationCountByJob }) => {
  const resultJobs = []

  job.jobs.map((offre, idx) => {
    const resultJob = itemModel("matcha")

    let email = {}

    email = encryptMailWithIV({ value: job.email, caller })

    resultJob.id = `${job.establishment_id}-${idx}`
    resultJob.title = offre.rome_appellation_label ?? offre.rome_label
    resultJob.contact = {
      ...email,
      name: job.first_name + " " + job.last_name,
      phone: job.phone,
    }

    resultJob.place.distance = distance ? roundDistance(distance) : null
    resultJob.place.fullAddress = job.address
    resultJob.place.address = job.address
    resultJob.place.latitude = job.geo_coordinates.split(",")[0]
    resultJob.place.longitude = job.geo_coordinates.split(",")[1]

    resultJob.company.siret = job.establishment_siret
    resultJob.company.name = job.establishment_enseigne || job.establishment_raison_sociale || "Enseigne inconnue"
    resultJob.company.size = job.establishment_size

    resultJob.company.mandataire = job.is_delegated
    resultJob.company.place = { city: job.establishment_location }

    resultJob.nafs = [{ label: job.naf_label }]
    resultJob.company.creationDate = job.establishment_creation_date

    resultJob.diplomaLevel = offre.job_level_label
    resultJob.createdAt = job.job_creation_date
    resultJob.lastUpdateAt = job.job_update_date

    resultJob.job = {
      id: offre._id,
      description: offre.job_description || "",
      creationDate: offre.job_creation_date,
      contractType: offre.job_type.join(", "),
      jobStartDate: offre.job_start_date,
      romeDetails: offre.rome_detail,
      rythmeAlternance: offre.job_rythm || null,
      dureeContrat: offre.job_duration,
      quantiteContrat: offre.job_count,
      elligibleHandicap: offre.is_disabled_elligible,
    }

    resultJob.romes = []
    offre.rome_code.map((code) => resultJob.romes.push({ code, label: null }))

    const applicationCount = matchaApplicationCountByJob.find((job) => job._id == offre._id)
    resultJob.applicationCount = applicationCount?.count || 0
    resultJobs.push(resultJob)
  })

  return resultJobs
}

const sortLbaJobs = (matchas) => {
  matchas.results.sort((a, b) => {
    if (a?.title?.toLowerCase() < b?.title?.toLowerCase()) {
      return -1
    }
    if (a?.title?.toLowerCase() > b?.title?.toLowerCase()) {
      return 1
    }

    if (a?.company?.name?.toLowerCase() < b?.company?.name?.toLowerCase()) {
      return -1
    }
    if (a?.company?.name?.toLowerCase() > b?.company?.name?.toLowerCase()) {
      return 1
    }

    return 0
  })
}
