// @ts-nocheck
import { setTimeout } from "timers/promises"

import distance from "@turf/distance"
import axios from "axios"

import { IApiError, manageApiError } from "../../common/utils/errorManager"
import { roundDistance } from "../../common/utils/geolib"
import { trackApiCall } from "../../common/utils/sendTrackingEvent"
import { itemModel } from "../../model/itemModel"
import { NIVEAUX_POUR_OFFRES_PE } from "../../services/constant.service"
import { ILbaItem } from "../../services/lbaitem.shared.service.types"
import { filterJobsByOpco } from "../../services/opco.service"

//const poleEmploi = require("./common");
import { getAccessToken, getRoundedRadius, peApiHeaders } from "./common"

const blackListedCompanies = ["iscod", "oktogone", "institut europeen f 2i"]

const getSomePeJobs = async ({ romes, insee, radius, lat, long, caller, diploma, opco, opcoUrl, api }) => {
  let jobs: PEResponse | IApiError = null
  const currentRadius = radius || 20000
  const jobLimit = 50 //TODO: query params options or default value from properties -> size || 50

  let trys = 0

  while (trys < 3) {
    jobs = await getPeJobs({ romes, insee, radius: currentRadius, jobLimit, caller, diploma, api })

    if (jobs.status === 429) {
      console.log("PE jobs api quota exceeded. Retrying : ", trys + 1)
      // trois essais pour gérer les 429 quotas exceeded des apis PE.
      trys++
      await setTimeout(1000, "result")
    } else {
      break
    }
  }

  if (jobs?.result == "error") {
    return jobs
  }

  jobs = transformPeJobsForIdea({ jobs, radius: currentRadius, lat, long, caller })

  // tri du résultat fusionné sur le critère de poids descendant
  if (jobs) {
    jobs.sort((a, b) => {
      return b.place.distance - a.place.distance
    })
  }

  // filtrage sur l'opco
  if (opco || opcoUrl) {
    jobs = await filterJobsByOpco({ opco, opcoUrl, jobs })
  }

  // suppression du siret pour les appels par API. On ne remonte le siret que dans le cadre du front LBA.
  if (caller) {
    // on ne remonte le siret que dans le cadre du front LBA. Cette info n'est pas remontée par API
    jobs.forEach((job, idx) => {
      jobs[idx].company.siret = null
    })
  }

  return { results: jobs }
}

// update du contenu avec des résultats pertinents par rapport au rayon
const transformPeJobsForIdea = ({ jobs, radius, lat, long, caller }) => {
  const resultJobs: PEJob[] = []

  if (jobs.resultats && jobs.resultats.length) {
    for (let i = 0; i < jobs.resultats.length; ++i) {
      const job = transformPeJobForIdea({ job: jobs.resultats[i], lat, long, caller })

      if (job.place.distance < getRoundedRadius(radius)) {
        if (!job?.company?.name || blackListedCompanies.indexOf(job.company.name.toLowerCase()) < 0) {
          resultJobs.push(job)
        }
      }
    }
  }

  return resultJobs
}

// Adaptation au modèle LBA et conservation des seules infos utilisées des offres
const transformPeJobForIdea = ({ job, lat = null, long = null }): PEJob => {
  const resultJob = itemModel("peJob")

  resultJob.title = job.intitule

  //contact
  if (job.contact) {
    resultJob.contact = {}
    if (job.contact.nom) resultJob.contact.name = job.contact.nom
    if (job.contact.courriel) resultJob.contact.email = job.contact.courriel
    if (job.contact.coordonnees1)
      resultJob.contact.info = `${job.contact.coordonnees1}${job.contact.coordonnees2 ? "\n" + job.contact.coordonnees2 : ""}${
        job.contact.coordonnees3 ? "\n" + job.contact.coordonnees3 : ""
      }`
  }

  resultJob.place = {
    distance: lat === null || lat === "" ? 0 : computeJobDistanceToSearchCenter(job, lat, long),
    insee: job.lieuTravail.commune,
    zipCode: job.lieuTravail.codePostal,
    city: job.lieuTravail.libelle,
    latitude: job.lieuTravail.latitude,
    longitude: job.lieuTravail.longitude,
    fullAddress: `${job.lieuTravail.libelle}${job.lieuTravail.codePostal ? " " + job.lieuTravail.codePostal : ""}`,
  }

  resultJob.company = {}

  if (job.entreprise) {
    if (job.entreprise.nom) {
      resultJob.company.name = job.entreprise.nom
    }
    if (job.entreprise.logo) {
      resultJob.company.logo = job.entreprise.logo
    }
    if (job.entreprise.description) {
      resultJob.company.description = job.entreprise.description
    }
    resultJob.company.siret = job.entreprise.siret
  }

  resultJob.url = `https://candidat.pole-emploi.fr/offres/recherche/detail/${job.id}?at_medium=CMP&at_campaign=labonnealternance_candidater_a_une_offre`

  resultJob.job = {
    id: job.id,
    creationDate: job.dateCreation,
    description: job.description || "",
    contractType: job.typeContrat,
    contractDescription: job.typeContratLibelle,
    duration: job.dureeTravailLibelle,
  }

  if (job.romeCode) {
    resultJob.romes = [
      {
        code: job.romeCode,
        label: job.appellationLibelle,
      },
    ]
  }
  if (job.secteurActivite) {
    resultJob.nafs = [
      {
        code: job.secteurActivite,
        label: job.secteurActiviteLibelle,
      },
    ]
  }

  return resultJob
}

const computeJobDistanceToSearchCenter = (job, lat, long) => {
  // si la distance au centre du point de recherche n'est pas connue, on la calcule avec l'utilitaire distance de turf.js
  if (job.lieuTravail && job.lieuTravail.latitude && job.lieuTravail.longitude) {
    return roundDistance(distance([long, lat], [job.lieuTravail.longitude, job.lieuTravail.latitude]))
  }

  return null
}

const peJobsApiEndpoint = "https://api.pole-emploi.io/partenaire/offresdemploi/v2/offres/search"
const peJobApiEndpoint = "https://api.pole-emploi.io/partenaire/offresdemploi/v2/offres/"
const peContratsAlternances = "E2,FS" //E2 -> Contrat d'Apprentissage, FS -> contrat de professionalisation

// warning: type écrit à partir d'un échantillon de données
export type PEJob = {
  id: string
  intitule: string
  description: string
  dateCreation: string
  dateActualisation: string
  lieuTravail: object[]
  romeCode: string
  romeLibelle: string
  appellationlibelle: string
  entreprise: object[]
  typeContrat: string
  typeContratLibelle: string
  natureContrat: string
  experienceExige: string
  experienceLibelle: string
  competences?: [][]
  salaire: object[] | object
  dureeTravailLibelle?: string
  dureeTravailLibelleConverti?: string
  alternance: boolean
  contact?: object[] | object
  agence?: object[]
  nombrePostes: number
  accessibleTH: boolean
  deplacementCode?: string
  deplacementLibelle?: string
  qualificationCode?: string
  qualificationLibelle?: string
  codeNAF?: string
  secteurActivite?: string
  secteurActiviteLibelle?: string
  qualitesProfessionnelles?: [][]
  origineOffre: object[]
  offresManqueCandidats?: boolean
  formations?: [][]
  langues?: [][]
  complementExercice?: string
}

export type PEResponse = {
  resultats: PEJob[]
  filtresPossibles: {
    filtre: string
    agregation: [][]
  }[]
}

const getPeJobs = async ({ romes, insee, radius, jobLimit, caller, diploma, api = "jobV1" }): Promise<PEResponse | IApiError> => {
  try {
    const token = await getAccessToken("pe")

    const hasLocation = insee ? true : false

    const headers = peApiHeaders
    headers.Authorization = `Bearer ${token}`

    // hack : les codes insee des villes à arrondissement retournent une erreur. il faut utiliser un code insee d'arrondissement
    let codeInsee = insee
    if (insee === "75056") codeInsee = "75101"
    else if (insee === "13055") codeInsee = "13201"
    else if (insee === "69123") codeInsee = "69381"

    const distance = radius || 10

    const params = {
      codeROME: romes.join(","),
      commune: codeInsee,
      sort: hasLocation ? 2 : 0, //sort: 0, TODO: remettre sort 0 après expérimentation CBS
      natureContrat: peContratsAlternances,
      range: `0-${jobLimit - 1}`,
    }

    if (diploma) {
      const niveauRequis = NIVEAUX_POUR_OFFRES_PE[diploma]
      if (niveauRequis && niveauRequis !== "NV5") {
        // pas de filtrage sur niveau requis NV5 car pas de résultats
        params.niveauFormation = niveauRequis
      }
    }

    if (hasLocation) {
      params.insee = codeInsee
      params.distance = distance
    }

    const jobs = await axios.get(`${peJobsApiEndpoint}`, {
      params,
      headers,
    })

    return jobs.data
  } catch (error) {
    return manageApiError({ error, api_path: api, caller, errorTitle: `getting jobs from PE (${api})` })
  }
}

const getPeJobFromId = async ({ id, caller }: { id: string; caller?: string }): IApiError | { peJobs: ILbaItem[] } => {
  try {
    const token = await getAccessToken("pe")
    const headers = peApiHeaders
    headers.Authorization = `Bearer ${token}`

    const job = await axios.get(`${peJobApiEndpoint}${id}`, {
      headers,
    })

    if (job.status === 204 || job.status === 400) {
      if (caller) {
        trackApiCall({ caller, api_path: "jobV1/job", response: "Error" })
      }

      return { error: "not_found", result: "not_found", message: "Offre non trouvée" }
    } else {
      const peJob = transformPeJobForIdea({ job: job.data, caller })

      if (caller) {
        trackApiCall({ caller, job_count: 1, result_count: 1, api_path: "jobV1/job", response: "OK" })
        // on ne remonte le siret que dans le cadre du front LBA. Cette info n'est pas remontée par API
        peJob.company.siret = null
      }

      return { peJobs: [peJob] }
    }
  } catch (error) {
    return manageApiError({ error, api_path: "jobV1/job", caller, errorTitle: "getting job by id from PE" })
  }
}

export { getPeJobFromId, getSomePeJobs }
