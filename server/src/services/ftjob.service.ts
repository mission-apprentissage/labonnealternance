import { setTimeout } from "timers/promises"

import { badRequest, notFound } from "@hapi/boom"
import distance from "@turf/distance"
import { NIVEAUX_POUR_OFFRES_PE } from "shared/constants"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"
import { TRAINING_CONTRACT_TYPE } from "shared/constants/recruteur"

import { getFtJob, searchForFtJobs } from "@/common/apis/franceTravail/franceTravail.client"

import { IApiError, manageApiError } from "../common/utils/errorManager"
import { roundDistance } from "../common/utils/geolib"
import { trackApiCall } from "../common/utils/sendTrackingEvent"
import { sentryCaptureException } from "../common/utils/sentryUtils"

import { FTJob, FTResponse } from "./ftjob.service.types"
import { TLbaItemResult } from "./jobOpportunity.service.types"
import { ILbaItemCompany, ILbaItemContact, ILbaItemFtJob } from "./lbaitem.shared.service.types"
import { filterJobsByOpco } from "./opco.service"

const blackListedCompanies = ["iscod", "oktogone", "institut europeen f 2i", "ief2i", "institut f2i", "openclassrooms", "mewo", "acp interim et recrutement", "jour j recrutement"]

const correspondancesNatureContrat = {
  "Cont. professionnalisation": TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION,
  "Contrat apprentissage": TRAINING_CONTRACT_TYPE.APPRENTISSAGE,
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
 * @param {FTJob} job l'offre géolocalisée dont nous n'avons pas la distance au centre
 * @param {string} latitude la latitude du centre de recherche
 * @param {string} longitude la longitude du centre de recherche
 * @return {number}
 */
const computeJobDistanceToSearchCenter = (job: FTJob, latitude: string, longitude: string) => {
  if (job.lieuTravail && job.lieuTravail.latitude && job.lieuTravail.longitude) {
    return roundDistance(distance([parseFloat(longitude), parseFloat(latitude)], [parseFloat(job.lieuTravail.longitude), parseFloat(job.lieuTravail.latitude)]))
  }

  return null
}

/**
 * Adaptation au modèle LBA et conservation des seules infos utilisées des offres
 */
const transformFtJob = ({ job, latitude = null, longitude = null }: { job: FTJob; latitude?: string | null; longitude?: string | null }): ILbaItemFtJob => {
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

  const resultJob: ILbaItemFtJob = {
    ideaType: LBA_ITEM_TYPE_OLD.PEJOB,
    //ideaType: LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES,
    id: job.id,
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
    url: `https://candidat.francetravail.fr/offres/recherche/detail/${job.id}?at_medium=CMP&at_campaign=labonnealternance_candidater_a_une_offre`,
    job: {
      id: job.id,
      creationDate: new Date(job.dateCreation),
      description: job.description || "",
      contractType: job.typeContrat,
      contractDescription: job.typeContratLibelle,
      duration: job.dureeTravailLibelle,
      type: correspondancesNatureContrat[job.natureContrat] ? [correspondancesNatureContrat[job.natureContrat]] : null,
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
 * Adaptation au modèle LBA et conservation des seules infos utilisées des offres avec les données minimale pour l'UI du site LBA
 */
const transformFtJobWithMinimalData = ({ job, latitude = null, longitude = null }: { job: FTJob; latitude?: string | null; longitude?: string | null }): ILbaItemFtJob => {
  const company: ILbaItemCompany = {}
  if (job.entreprise) {
    if (job.entreprise.nom) {
      company.name = job.entreprise.nom
    }
    company.siret = job.entreprise.siret
  }

  const resultJob: ILbaItemFtJob = {
    ideaType: LBA_ITEM_TYPE_OLD.PEJOB,
    //ideaType: LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES,
    id: job.id,
    title: job.intitule,
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
    job: {
      creationDate: new Date(job.dateCreation),
    },
  }

  return resultJob
}

/**
 * Converti les offres issues de l'api France Travail en objets de type ILbaItem
 */
const transformFtJobs = ({ jobs, radius, latitude, longitude, isMinimalData }: { jobs: FTJob[]; radius: number; latitude: string; longitude: string; isMinimalData: boolean }) => {
  const resultJobs: ILbaItemFtJob[] = []

  if (jobs && jobs.length) {
    for (let i = 0; i < jobs.length; ++i) {
      if (jobs[i].lieuTravail.latitude) {
        // exclusion des offres ft sans geoloc
        const job = isMinimalData
          ? transformFtJobWithMinimalData({
              job: jobs[i],
              latitude,
              longitude,
            })
          : transformFtJob({ job: jobs[i], latitude, longitude })

        const d = job.place?.distance ?? 0
        if (d < getRoundedRadius(radius)) {
          if (!job?.company?.name || blackListedCompanies.indexOf(job.company.name.toLowerCase()) < 0) {
            resultJobs.push(job)
          }
        }
      }
    }
  }

  return resultJobs
}

/**
 * Récupère une liste d'offres depuis l'API France Travail
 */
export const getFtJobs = async ({
  romes,
  insee,
  radius,
  jobLimit,
  caller,
  diploma,
  api = "jobV1",
}: {
  romes: string[]
  insee?: string
  radius: number
  jobLimit: number
  caller: string
  diploma: string
  api: string
}): Promise<FTResponse | IApiError> => {
  try {
    const peContratsAlternances = "E2,FS" //E2 -> Contrat d'Apprentissage, FS -> contrat de professionalisation

    const hasLocation = insee ? true : false

    // hack : les codes insee des villes à arrondissement retournent une erreur. il faut utiliser un code insee d'arrondissement
    let codeInsee = insee
    if (insee === "75056") codeInsee = "75101"
    else if (insee === "13055") codeInsee = "13201"
    else if (insee === "69123") codeInsee = "69381"

    const distance = radius || 10

    const params: Parameters<typeof searchForFtJobs>[0] = {
      codeROME: romes.join(","),
      commune: codeInsee,
      sort: hasLocation ? 2 : 0, //sort: 0, TODO: remettre sort 0 après expérimentation CBS
      natureContrat: peContratsAlternances,
      range: `0-${jobLimit - 1}`,
    }

    if (diploma) {
      const niveauRequis = NIVEAUX_POUR_OFFRES_PE[diploma]
      params.niveauFormation = niveauRequis
    }

    if (hasLocation) {
      params.insee = codeInsee
      params.distance = distance
    }

    const jobs = await searchForFtJobs(params, { throwOnError: false })

    if (jobs === null || jobs === "") {
      const emptyPeResponse: FTResponse = { resultats: [] }
      return emptyPeResponse
    }

    return jobs
  } catch (error) {
    sentryCaptureException(error)
    return manageApiError({ error, api_path: api, caller, errorTitle: `getting jobs from PE (${api})` })
  }
}

/**
 * Récupère une liste d'offres depuis l'API France Travail
 */
export const getFtJobsV2 = async ({
  romes,
  insee,
  radius,
  jobLimit,
  diploma,
}: {
  romes: string[] | null
  insee: string | null
  radius: number
  jobLimit: number
  diploma: keyof typeof NIVEAUX_POUR_OFFRES_PE | null | undefined
}): Promise<FTResponse> => {
  const distance = radius || 10

  const params: Parameters<typeof searchForFtJobs>[0] = {
    sort: 2,
    natureContrat: "E2,FS", //E2 -> Contrat d'Apprentissage, FS -> contrat de professionalisation
    range: `0-${jobLimit - 1}`,
  }

  if (romes) {
    params.codeROME = romes.join(",")
  }

  if (insee) {
    // hack : les codes insee des villes à arrondissement retournent une erreur. il faut utiliser un code insee d'arrondissement
    let codeInsee = insee
    if (insee === "75056") codeInsee = "75101"
    else if (insee === "13055") codeInsee = "13201"
    else if (insee === "69123") codeInsee = "69381"

    params.commune = codeInsee
    params.distance = distance || 10
  }

  if (diploma) {
    params.niveauFormation = NIVEAUX_POUR_OFFRES_PE[diploma]
  }

  const jobs = await searchForFtJobs(params, { throwOnError: true })

  if (jobs === null || jobs === "") {
    return { resultats: [] }
  }

  return jobs
}

/**
 * Retourne une liste d'offres France Travail au format unifié La bonne alternance
 * applique post traitements suivants :
 * - filtrage optionnel sur les opco
 * - suppressions de données non autorisées pour des consommateurs extérieurs
 */
export const getSomeFtJobs = async ({ romes, insee, radius, latitude, longitude, caller, diploma, opco, opcoUrl, api, isMinimalData }): Promise<TLbaItemResult<ILbaItemFtJob>> => {
  let ftResponse: FTResponse | IApiError | null = null
  const currentRadius = radius || 20000
  const jobLimit = 150

  let trys = 0

  while (trys < 3) {
    ftResponse = await getFtJobs({ romes, insee, radius: currentRadius, jobLimit, caller, diploma, api })

    if ("status" in ftResponse && ftResponse.status === 429) {
      console.warn("PE jobs api quota exceeded. Retrying : ", trys + 1)
      // trois essais pour gérer les 429 quotas exceeded des apis PE.
      trys++
      await setTimeout(1000, "result")
    } else {
      break
    }
  }

  if (ftResponse && "error" in ftResponse && ftResponse?.result === "error") {
    return ftResponse
  }

  const resultats = ftResponse && "resultats" in ftResponse ? ftResponse.resultats : []

  let jobs = transformFtJobs({ jobs: resultats, radius: currentRadius, latitude, longitude, isMinimalData })

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
 * @description Retourne un tableau contenant la seule offre France Travail identifiée
 */
export const getFtJobFromId = async ({ id, caller }: { id: string; caller: string | undefined }): Promise<IApiError | { peJobs: ILbaItemFtJob[] }> => {
  try {
    const job = await getFtJob(id)

    if (job.status === 204 || job.data === "") {
      throw notFound()
    }
    if (job.status === 400) {
      throw badRequest()
    }

    const ftJob = transformFtJob({ job: job.data })

    if (caller) {
      trackApiCall({ caller, job_count: 1, result_count: 1, api_path: "jobV1/job", response: "OK" })
      // on ne remonte le siret que dans le cadre du front LBA. Cette info n'est pas remontée par API
      if (ftJob.company) {
        ftJob.company.siret = null
      }
    }

    return { peJobs: [ftJob] }
  } catch (error: any) {
    if (!error.isBoom) {
      sentryCaptureException(error)
    }
    return manageApiError({ error, api_path: "jobV1/job", caller, errorTitle: "getting job by id from FT" })
  }
}
/**
 * @description Retourne un tableau contenant la seule offre Pôle emploi identifiée
 */
export const getFtJobFromIdV2 = async ({ id, caller }: { id: string; caller: string | undefined }): Promise<{ job: ILbaItemFtJob } | null> => {
  try {
    const job = await getFtJob(id)

    if (job.status === 204 || job.data === "") {
      throw notFound()
    }
    if (job.status === 400) {
      throw badRequest()
    }

    const ftJob = transformFtJob({ job: job.data })

    if (caller) {
      trackApiCall({ caller, job_count: 1, result_count: 1, api_path: "job/offres_emploi_partenaires", response: "OK" })
      // on ne remonte le siret que dans le cadre du front LBA. Cette info n'est pas remontée par API
      if (ftJob.company) {
        ftJob.company.siret = null
      }
    }

    return { job: ftJob }
  } catch (error: any) {
    if (!error.isBoom) {
      sentryCaptureException(error)
    }
    return null // @KB il faut qu'on revoie ça
  }
}
