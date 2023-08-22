import distance from "@turf/distance"
import axios, { AxiosRequestHeaders } from "axios"
import { setTimeout } from "timers/promises"
import { NIVEAUX_POUR_OFFRES_PE } from "./constant.service.js"
import { roundDistance } from "../common/utils/geolib.js"
import { IApiError, manageApiError } from "../common/utils/errorManager.js"
import { trackApiCall } from "../common/utils/sendTrackingEvent.js"
import { itemModel } from "../model/itemModel.js"
import { filterJobsByOpco } from "./opco.service.js"
import { ILbaItem, LbaItem } from "./lbaitem.shared.service.types.js"
import dayjs from "./dayjs.service.js"
import config from "../config.js"
import { PEJob, PEResponse } from "./pejob.service.types.js"

const accessTokenEndpoint = "https://entreprise.pole-emploi.fr/connexion/oauth2/access_token?realm=%2Fpartenaire"
const contentType = "application/x-www-form-urlencoded"
const headers = { headers: { "Content-Type": contentType }, timeout: 3000 }
const clientId = config.esdClientId === "1234" ? process.env.ESD_CLIENT_ID : config.esdClientId
const clientSecret = config.esdClientSecret === "1234" ? process.env.ESD_CLIENT_SECRET : config.esdClientSecret
const scopeApisPE = `application_${clientId}%20`
const scopePE = "api_offresdemploiv2%20o2dsoffre"
const paramApisPE = `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}&scope=${scopeApisPE}`
const paramPE = `${paramApisPE}${scopePE}`
const peApiHeaders = { "Content-Type": "application/json", Accept: "application/json" } as AxiosRequestHeaders
let tokenPE = null

const blackListedCompanies = ["iscod", "oktogone", "institut europeen f 2i"]

const peJobsApiEndpoint = "https://api.pole-emploi.io/partenaire/offresdemploi/v2/offres/search"
const peJobApiEndpoint = "https://api.pole-emploi.io/partenaire/offresdemploi/v2/offres/"
const peContratsAlternances = "E2,FS" //E2 -> Contrat d'Apprentissage, FS -> contrat de professionalisation

/**
 *  Récupère un token d'accès aux API de Pôle emploi
 *  @return {Promise<string>}
 */
const getAccessToken = async (): Promise<string> => {
  try {
    const now = dayjs()

    if (tokenPE?.expiry.isAfter(now)) {
      return tokenPE.value
    } else {
      const response = await axios.post(accessTokenEndpoint, paramPE, headers)

      if (response.data) {
        tokenPE = {
          value: response.data.access_token,
          expiry: dayjs().add(response.data.expires_in - 10, "s"),
        }
        return tokenPE.value
      } else {
        return "no_result"
      }
    }
  } catch (error) {
    console.log(error)
    return "error"
  }
}

const peJobApiEndpointReferentiel = "https://api.pole-emploi.io/partenaire/offresdemploi/v2/referentiel/"
/**
 * Utilitaire à garder pour interroger les référentiels PE non documentés par ailleurs
 * Liste des référentiels disponible sur https://www.emploi-store-dev.fr/portail-developpeur-cms/home/catalogue-des-api/documentation-des-api/api/api-offres-demploi-v2/referentiels.html
 *
 * @param {string} referentiel
 */
const getPeApiReferentiels = async (referentiel: string) => {
  try {
    const token = await getAccessToken()
    const headers = peApiHeaders
    headers.Authorization = `Bearer ${token}`

    const referentiels = await axios.get(`${peJobApiEndpointReferentiel}${referentiel}`, {
      headers,
    })

    console.log(`Référentiel ${referentiel} :`, referentiels) // retour car utilisation en mode CLI uniquement
  } catch (error) {
    console.log("error getReferentiel ", error)
  }
}

/**
 * formule de modification du rayon de distance pour prendre en compte les limites des communes
 */
const getRoundedRadius = (radius) => {
  return radius * 1.2
}
/**
 * Calcule la distance au centre de recherche lorsque l'information est manquante
 * Dépend de turf.js
 */
const computeJobDistanceToSearchCenter = (job: PEJob, lat: number, long: number) => {
  if (job.lieuTravail && job.lieuTravail.latitude && job.lieuTravail.longitude) {
    return roundDistance(distance([long, lat], [job.lieuTravail.longitude, job.lieuTravail.latitude]))
  }

  return null
}

/**
 * Adaptation au modèle LBA et conservation des seules infos utilisées des offres
 * @param {PEJob} job une offre Pôle Emploi
 * @param {number | null} lat la latitude du centre de recherche
 * @param {number | null} long la longitude du centre de recherche
 * @return {ILbaItem}
 */
const transformPeJob = ({ job, lat = null, long = null }: { job: PEJob; lat: number; long: number }): ILbaItem => {
  const resultJob = new LbaItem("peJob")

  resultJob.title = job.intitule

  //contact
  if (job.contact) {
    resultJob.contact = {}
    if (job.contact.nom) {
      resultJob.contact.name = job.contact.nom
    }
    if (job.contact.courriel) {
      resultJob.contact.email = job.contact.courriel
    }
    if (job.contact.coordonnees1) {
      resultJob.contact.info = `${job.contact.coordonnees1}${job.contact.coordonnees2 ? "\n" + job.contact.coordonnees2 : ""}${
        job.contact.coordonnees3 ? "\n" + job.contact.coordonnees3 : ""
      }`
    }
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

// update du contenu avec des résultats pertinents par rapport au rayon
const transformPeJobs = ({ jobs, radius, lat, long, caller }) => {
  const resultJobs: PEJob[] = []

  if (jobs.resultats && jobs.resultats.length) {
    for (let i = 0; i < jobs.resultats.length; ++i) {
      const job = transformPeJob({ job: jobs.resultats[i], lat, long, caller })

      if (job.place.distance < getRoundedRadius(radius)) {
        if (!job?.company?.name || blackListedCompanies.indexOf(job.company.name.toLowerCase()) < 0) {
          resultJobs.push(job)
        }
      }
    }
  }

  return resultJobs
}

const getPeJobs = async ({ romes, insee, radius, jobLimit, caller, diploma, api = "jobV1" }): Promise<PEResponse | IApiError> => {
  try {
    const token = await getAccessToken()

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

export const getSomePeJobs = async ({ romes, insee, radius, lat, long, caller, diploma, opco, opcoUrl, api }) => {
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

  jobs = transformPeJobs({ jobs, radius: currentRadius, lat, long, caller })

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

export const getPeJobFromId = async ({ id, caller }: { id: string; caller: string }): IApiError | { peJobs: ILbaItem[] } => {
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
      const peJob = transformPeJob({ job: job.data, caller })

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
