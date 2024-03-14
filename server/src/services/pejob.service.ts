import { setTimeout } from "timers/promises"

import distance from "@turf/distance"
import Boom from "boom"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { getPeJob, getPeReferentiels, searchForPeJobs } from "@/common/apis/Pe"

import { IApiError, manageApiError } from "../common/utils/errorManager"
import { roundDistance } from "../common/utils/geolib"
import { trackApiCall } from "../common/utils/sendTrackingEvent"

import { NIVEAUX_POUR_OFFRES_PE } from "./constant.service"
import { TLbaItemResult } from "./jobOpportunity.service.types"
import { ILbaItemCompany, ILbaItemContact, ILbaItemPeJob } from "./lbaitem.shared.service.types"
import { filterJobsByOpco } from "./opco.service"
import { PEJob, PEResponse } from "./pejob.service.types"

const blackListedCompanies = ["iscod", "oktogone", "institut europeen f 2i"]

/**
 * Utilitaire à garder pour interroger les référentiels PE non documentés par ailleurs
 * Liste des référentiels disponible sur https://www.emploi-store-dev.fr/portail-developpeur-cms/home/catalogue-des-api/documentation-des-api/api/api-offres-demploi-v2/referentiels.html
 *
 * @param {string} referentiel
 */
export const getPeApiReferentiels = async (referentiel: string) => {
  try {
    const referentiels = await getPeReferentiels(referentiel)
    console.info(`Référentiel ${referentiel} :`, referentiels) // retour car utilisation en mode CLI uniquement
  } catch (error) {
    console.error("error getReferentiel ", error)
  }
}

/**
 * formule de modification du rayon de distance pour prendre en compte les limites des communes
 * @param {number} radius le rayon de recherche en km
 * @return {number}
 */
const getRoundedRadius = (radius: number) => {
  return radius * 1.2
}

/**
 * Calcule la distance au centre de recherche lorsque l'information est manquante
 * Dépend de turf
 * @param {PEJob} job l'offre géolocalisée dont nous n'avons pas la distance au centre
 * @param {string} latitude la latitude du centre de recherche
 * @param {string} longitude la longitude du centre de recherche
 * @return {number}
 */
const computeJobDistanceToSearchCenter = (job: PEJob, latitude: string, longitude: string) => {
  if (job.lieuTravail && job.lieuTravail.latitude && job.lieuTravail.longitude) {
    return roundDistance(distance([parseFloat(longitude), parseFloat(latitude)], [parseFloat(job.lieuTravail.longitude), parseFloat(job.lieuTravail.latitude)]))
  }

  return null
}

/**
 * Adaptation au modèle LBA et conservation des seules infos utilisées des offres
 */
const transformPeJob = ({ job, latitude = null, longitude = null }: { job: PEJob; latitude?: string | null; longitude?: string | null }): ILbaItemPeJob => {
  const contact: ILbaItemContact | null = job.contact
    ? {
        name: job.contact.nom,
        email: job.contact.courriel,
        info: job.contact.coordonnees1
          ? `${job.contact.coordonnees1}${job.contact.coordonnees2 ? "\n" + job.contact.coordonnees2 : ""}${job.contact.coordonnees3 ? "\n" + job.contact.coordonnees3 : ""}`
          : "",
      }
    : null

  const company: ILbaItemCompany = {}
  if (job.entreprise) {
    if (job.entreprise.nom) {
      company.name = job.entreprise.nom
    }
    if (job.entreprise.logo) {
      company.logo = job.entreprise.logo
    }
    if (job.entreprise.description) {
      company.description = job.entreprise.description
    }
    company.siret = job.entreprise.siret
  }

  const resultJob: ILbaItemPeJob = {
    ideaType: LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES,
    title: job.intitule,
    contact,
    place: {
      distance: !latitude || !longitude ? 0 : computeJobDistanceToSearchCenter(job, latitude, longitude),
      insee: job.lieuTravail.commune,
      zipCode: job.lieuTravail.codePostal,
      city: job.lieuTravail.libelle,
      latitude: job.lieuTravail.latitude ? parseFloat(job.lieuTravail.latitude) : null,
      longitude: job.lieuTravail.longitude ? parseFloat(job.lieuTravail.longitude) : null,
      fullAddress: `${job.lieuTravail.libelle}${job.lieuTravail.codePostal ? " " + job.lieuTravail.codePostal : ""}`,
    },
    company,
    url: `https://candidat.pole-emploi.fr/offres/recherche/detail/${job.id}?at_medium=CMP&at_campaign=labonnealternance_candidater_a_une_offre`,
    job: {
      id: job.id,
      creationDate: new Date(job.dateCreation),
      description: job.description || "",
      contractType: job.typeContrat,
      contractDescription: job.typeContratLibelle,
      duration: job.dureeTravailLibelle,
    },
    romes: job.romeCode
      ? [
          {
            code: job.romeCode,
            label: job.appellationLibelle,
          },
        ]
      : null,
    nafs: job.secteurActivite
      ? [
          {
            code: job.secteurActivite,
            label: job.secteurActiviteLibelle,
          },
        ]
      : null,
  }

  return resultJob
}

/**
 * Converti les offres issues de l'api Pôle emploi en objets de type ILbaItem
 */
const transformPeJobs = ({ jobs, radius, latitude, longitude }: { jobs: PEJob[]; radius: number; latitude: string; longitude: string }) => {
  const resultJobs: ILbaItemPeJob[] = []

  if (jobs && jobs.length) {
    for (let i = 0; i < jobs.length; ++i) {
      const job = transformPeJob({ job: jobs[i], latitude, longitude })

      const d = job.place?.distance ?? 0
      if (d < getRoundedRadius(radius)) {
        if (!job?.company?.name || blackListedCompanies.indexOf(job.company.name.toLowerCase()) < 0) {
          resultJobs.push(job)
        }
      }
    }
  }

  return resultJobs
}

/**
 * Récupère une liste d'offres depuis l'API Pôle emploi
 */
const getPeJobs = async ({
  romes,
  insee,
  radius,
  jobLimit,
  caller,
  diploma,
  api = "jobV1",
}: {
  romes: string[]
  insee: string
  radius: number
  jobLimit: number
  caller: string
  diploma: string
  api: string
}) => {
  try {
    const peContratsAlternances = "E2,FS" //E2 -> Contrat d'Apprentissage, FS -> contrat de professionalisation

    const hasLocation = insee ? true : false

    // hack : les codes insee des villes à arrondissement retournent une erreur. il faut utiliser un code insee d'arrondissement
    let codeInsee = insee
    if (insee === "75056") codeInsee = "75101"
    else if (insee === "13055") codeInsee = "13201"
    else if (insee === "69123") codeInsee = "69381"

    const distance = radius || 10

    const params: { codeROME: string; commune: string; sort: number; natureContrat: string; range: string; niveauFormation?: string; insee?: string; distance?: number } = {
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

    const jobs = await searchForPeJobs(params)

    console.log("getPeJobs", jobs)

    const data: PEResponse | IApiError | "" = jobs

    if (data === "") {
      const emptyPeResponse: PEResponse = { resultats: [] }
      return emptyPeResponse
    }

    return data
  } catch (error) {
    return manageApiError({ error, api_path: api, caller, errorTitle: `getting jobs from PE (${api})` })
  }
}

/**
 * Retourne une liste d'offres Pôle emploi au format unifié La bonne alternance
 * applique post traitements suivants :
 * - filtrage optionnel sur les opco
 * - suppressions de données non autorisées pour des consommateurs extérieurs
 */
export const getSomePeJobs = async ({ romes, insee, radius, latitude, longitude, caller, diploma, opco, opcoUrl, api }): Promise<TLbaItemResult<ILbaItemPeJob>> => {
  let peResponse: PEResponse | IApiError | null = null
  const currentRadius = radius || 20000
  const jobLimit = 150

  let trys = 0

  while (trys < 3) {
    peResponse = await getPeJobs({ romes, insee, radius: currentRadius, jobLimit, caller, diploma, api })

    if ("status" in peResponse && peResponse.status === 429) {
      console.warn("PE jobs api quota exceeded. Retrying : ", trys + 1)
      // trois essais pour gérer les 429 quotas exceeded des apis PE.
      trys++
      await setTimeout(1000, "result")
    } else {
      break
    }
  }

  if (peResponse && "error" in peResponse && peResponse?.result === "error") {
    return peResponse
  }

  const resultats = peResponse && "resultats" in peResponse ? peResponse.resultats : []

  let jobs = transformPeJobs({ jobs: resultats, radius: currentRadius, latitude, longitude })

  // tri du résultat fusionné sur le critère de poids descendant
  if (jobs) {
    jobs.sort((a, b) => {
      const bDist = b.place?.distance ?? 0
      const aDist = a.place?.distance ?? 0
      return bDist - aDist
    })
  }

  // filtrage sur l'opco
  if (opco || opcoUrl) {
    jobs = await filterJobsByOpco({ opco, opcoUrl, jobs })
  }

  // suppression du siret pour les appels par API. On ne remonte le siret que dans le cadre du front LBA.
  if (caller) {
    // on ne remonte le siret que dans le cadre du front LBA. Cette info n'est pas remontée par API
    jobs.forEach((job) => {
      if (job.company) {
        job.company.siret = null
      }
    })
  }

  return { results: jobs }
}

/**
 * Retourne un tableau contenant la seule offre Pôle emploi identifiée
 */
export const getPeJobFromId = async ({ id, caller }: { id: string; caller: string | undefined }): Promise<IApiError | { peJobs: ILbaItemPeJob[] }> => {
  try {
    const job = await getPeJob(id)

    if (!job) {
      throw Boom.notFound()
    }

    if (job.status === 204 || job.status === 400 || job.data === "") {
      if (caller) {
        trackApiCall({ caller, api_path: "jobV1/job", response: "Error" })
      }
      throw Boom.notFound()
    }

    const peJob = transformPeJob({ job: job.data })

    if (caller) {
      trackApiCall({ caller, job_count: 1, result_count: 1, api_path: "jobV1/job", response: "OK" })
      // on ne remonte le siret que dans le cadre du front LBA. Cette info n'est pas remontée par API
      if (peJob.company) {
        peJob.company.siret = null
      }
    }

    return { peJobs: [peJob] }
  } catch (error) {
    return manageApiError({ error, api_path: "jobV1/job", caller, errorTitle: "getting job by id from PE" })
  }
}
