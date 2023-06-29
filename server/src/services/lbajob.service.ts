import { encryptMailWithIV } from "../common/utils/encryptString.js"
import { IApiError, manageApiError } from "../common/utils/errorManager.js"
import { trackApiCall } from "../common/utils/sendTrackingEvent.js"
import { filterJobsByOpco } from "./opco.service.js"

const coordinatesOfFrance = [2.213749, 46.227638]

import { NIVEAUX_POUR_LBA } from "../common/constants.js"
import { roundDistance } from "../common/geolib.js"
import { matchaMock, matchaMockMandataire, matchasMock } from "../mocks/matchas-mock.js"
import { getOffreAvecInfoMandataire, getJobsFromElasticSearch } from "./formulaire.service.js"
import { getApplicationByJobCount, IApplicationCount } from "./application.service.js"
import { ILbaItem, LbaItem } from "./lbaitem.shared.service.types.js"
import { IRecruiter } from "../common/model/schema/recruiter/recruiter.types.js"
import { ILbaJobEsResult } from "./lbajob.service.types.js"

/**
 * Retourne les offres LBA correspondantes aux critères de recherche
 * @param {string} romes une liste de codes romes séparée par des virgules
 * @param {number} radius optionnel: le rayon de recherche pour une recherche centrée sur un point géographique
 * @param {string} latitude optionnel: la latitude du centre de recherche
 * @param {string} longitude optionnel: la longitude du centre de recherche
 * @param {string} api le nom de l'api à des fins de traçage des actions
 * @param {string} opco optionnel: le nom d'un opco pour ne retourner que les offres des sociétés affiliées à cet opco
 * @param {string} opcoUrl optionnel: l'url d'un opco pour ne retourner que les offres des sociétés affiliées à cet opcoUrl
 * @param {string} diploma optionnel: un fitre pour ne remonter ques les offres aboutissant à l'obtention du diplôme
 * @param {string} caller optionnel: l'identifiant de l'utilisateur de l'api
 * @param {string} useMock optionnel: un flag indiquant s'il faut retourner une valeur réelle ou une valeur mockée
 * @returns {Promise<IApiError | { results: ILbaItem[] }>}
 */
export const getLbaJobs = async ({
  romes,
  radius = 10,
  latitude,
  longitude,
  api,
  opco,
  opcoUrl,
  diploma,
  caller,
  useMock,
}: {
  romes: string
  radius?: number
  latitude?: string
  longitude?: string
  api: string
  opco?: string
  opcoUrl?: string
  diploma?: string
  caller?: string
  useMock?: string
}): Promise<IApiError | { results: ILbaItem[] }> => {
  if (radius === 0) {
    radius = 10
  }
  try {
    const hasLocation = Boolean(latitude)

    const distance = hasLocation ? radius : 21000

    const params: any = {
      romes: romes.split(","),
      distance,
      lat: hasLocation ? latitude : coordinatesOfFrance[1],
      lon: hasLocation ? longitude : coordinatesOfFrance[0],
    }

    if (diploma) {
      params.niveau = NIVEAUX_POUR_LBA[diploma]
    }

    const jobs = useMock === "true" ? matchasMock : await getJobsFromElasticSearch(params)

    const ids: string[] = jobs.flatMap(({ _source }) => _source.jobs.map(({ _id }) => _id))

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
const transformLbaJobs = ({
  jobs,
  caller,
  applicationCountByJob,
}: {
  jobs: ILbaJobEsResult[]
  caller?: string
  applicationCountByJob: IApplicationCount[]
}): { results: ILbaItem[] } => {
  const resultJobs = {
    results: [],
  }

  if (jobs && jobs.length) {
    for (let i = 0; i < jobs.length; ++i) {
      const companyJobs = transformLbaJob({
        job: jobs[i]._source,
        distance: jobs[i].sort[0],
        applicationCountByJob,
        caller,
      })
      companyJobs.map((job) => resultJobs.results.push(job))
    }
  }

  return resultJobs
}

/**
 * Retourne une offre LBA identifiée par son id
 * @param {string} id l'identifiant mongo de l'offre LBA
 * @param {string} caller optionnel. l'identifiant de l'utilisateur de l'api
 * @return {Promise<IApiError | { matchas: ILbaItem[] }>}
 */
export const getLbaJobById = async ({ id, caller }: { id: string; caller: string }): Promise<IApiError | { matchas: ILbaItem[] }> => {
  try {
    let rawJob = null
    if (id === "id-matcha-test") {
      rawJob = matchaMock._source
    } else if (id === "id-matcha-test2") {
      rawJob = matchaMockMandataire._source
    } else {
      rawJob = await getOffreAvecInfoMandataire(id)
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
const transformLbaJob = ({
  job,
  distance,
  caller,
  applicationCountByJob,
}: {
  job: Partial<IRecruiter>
  distance?: number
  caller?: string
  applicationCountByJob: IApplicationCount[]
}): ILbaItem[] => {
  return job.jobs.map((offre, idx) => {
    const resultJob = new LbaItem("matcha")
    const email = encryptMailWithIV({ value: job.email, caller })

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

    resultJob.company.place = { city: job?.address_detail?.localite }

    resultJob.nafs = [{ label: job.naf_label }]
    resultJob.company.creationDate = job.establishment_creation_date

    resultJob.diplomaLevel = offre.job_level_label
    resultJob.createdAt = job.createdAt
    resultJob.lastUpdateAt = job.updatedAt

    resultJob.job = {
      id: offre._id,
      description: offre.job_description || "",
      creationDate: offre.job_creation_date,
      contractType: offre.job_type.join(", "),
      jobStartDate: offre.job_start_date,
      romeDetails: offre.rome_detail,
      rythmeAlternance: offre.job_rythm || null,
      dureeContrat: "" + offre.job_duration,
      quantiteContrat: offre.job_count,
      elligibleHandicap: offre.is_disabled_elligible,
    }

    resultJob.romes = []
    offre.rome_code.map((code) => resultJob.romes.push({ code, label: null }))

    const applicationCount = applicationCountByJob.find((job) => job._id == offre._id)
    resultJob.applicationCount = applicationCount?.count || 0
    resultJobs.push(resultJob)
  })

  return resultJobs
}

/**
 * tri des ofres selon l'ordre alphabétique du titre (primaire) puis du nom de société (secondaire)
 * @param {{ results: ILbaItem[] }}
 */
const sortLbaJobs = (jobs: { results: ILbaItem[] }) => {
  jobs.results.sort((a, b) => {
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
