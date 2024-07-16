import { ILbaCompany, IRecruiter } from "shared"
import { JOB_OPPORTUNITY_TYPE, LBA_ITEM_TYPE, allLbaItemType } from "shared/constants/lbaitem"
import { IJobOpportunity } from "shared/interface/jobOpportunity.types"

import { IApiError } from "../common/utils/errorManager"
import { trackApiCall } from "../common/utils/sendTrackingEvent"
import config from "../config"

import { getSomeFtJobs } from "./ftjob.service"
import { FTJob } from "./ftjob.service.types"
import { TJobSearchQuery, TLbaItemResult } from "./jobOpportunity.service.types"
import { getSomeCompanies } from "./lbacompany.service"
import { ILbaItemFtJob, ILbaItemLbaCompany, ILbaItemLbaJob } from "./lbaitem.shared.service.types"
import { getLbaJobs, incrementLbaJobsViewCount } from "./lbajob.service"
import { jobsQueryValidator } from "./queryValidator.service"

/**
 * @description Retourn la compilation d'opportunités d'emploi au format unifié
 * chaque type d'opportunités d'emploi peut être émis en succès même si d'autres groupes sont en erreur
 */
export const getJobsFromApi = async ({
  romes,
  referer,
  caller,
  latitude,
  longitude,
  radius,
  insee,
  sources,
  diploma,
  opco,
  opcoUrl,
  api = "jobV1/jobs",
  isMinimalData,
}: {
  romes?: string
  referer?: string
  caller?: string | null
  latitude?: number
  longitude?: number
  radius?: number
  insee?: string
  sources?: string
  // sources?: LBA_ITEM_TYPE
  diploma?: string
  opco?: string
  opcoUrl?: string
  api?: string
  isMinimalData: boolean
}): Promise<
  | IApiError
  | { peJobs: TLbaItemResult<ILbaItemFtJob> | null; matchas: TLbaItemResult<ILbaItemLbaJob> | null; lbaCompanies: TLbaItemResult<ILbaItemLbaCompany> | null; lbbCompanies: null }
> => {
  try {
    const convertedSource = sources
      ?.split(",")
      .map((source) => {
        switch (source) {
          case "matcha":
            return LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA
          case "lba":
          case "lbb":
            return LBA_ITEM_TYPE.RECRUTEURS_LBA

          case "offres":
            return LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES

          default:
            return
        }
      })
      .join(",")

    const jobSources = !convertedSource ? allLbaItemType : convertedSource.split(",")
    const finalRadius = radius ?? 0

    const [peJobs, lbaCompanies, matchas] = await Promise.all([
      jobSources.includes(LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES)
        ? getSomeFtJobs({
            romes: romes?.split(","),
            insee: insee,
            radius: finalRadius,
            latitude,
            longitude,
            caller,
            diploma,
            api,
            opco,
            opcoUrl,
            isMinimalData,
          })
        : null,
      jobSources.includes(LBA_ITEM_TYPE.RECRUTEURS_LBA)
        ? getSomeCompanies({
            romes,
            latitude,
            longitude,
            radius: finalRadius,
            referer,
            caller,
            api,
            opco,
            opcoUrl,
            isMinimalData,
          })
        : null,
      jobSources.includes(LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA)
        ? getLbaJobs({
            romes,
            latitude,
            longitude,
            radius: finalRadius,
            api,
            caller,
            diploma,
            opco,
            opcoUrl,
            isMinimalData,
          })
        : null,
    ])

    return { peJobs, matchas, lbaCompanies, lbbCompanies: null }
  } catch (err) {
    if (caller) {
      trackApiCall({ caller, api_path: api, response: "Error" })
    }
    throw err
  }
}

/**
 * Retourne la compilation d'offres partenaires, d'offres LBA et de sociétés issues de l'algo
 * ou une liste d'erreurs si les paramètres de la requête sont invalides
 */
export const getJobsQuery = async (
  query: TJobSearchQuery
): Promise<
  | IApiError
  | { peJobs: TLbaItemResult<ILbaItemFtJob> | null; matchas: TLbaItemResult<ILbaItemLbaJob> | null; lbaCompanies: TLbaItemResult<ILbaItemLbaCompany> | null; lbbCompanies: null }
> => {
  const parameterControl = await jobsQueryValidator(query)

  if ("error" in parameterControl) {
    return parameterControl
  }

  const result = await getJobsFromApi({ romes: parameterControl.romes, ...query })

  if ("error" in result) {
    return result
  }

  let job_count = 0

  if ("lbaCompanies" in result && result.lbaCompanies && "results" in result.lbaCompanies) {
    job_count += result.lbaCompanies.results.length
  }

  if ("peJobs" in result && result.peJobs && "results" in result.peJobs) {
    job_count += result.peJobs.results.length
  }

  if ("matchas" in result && result.matchas && "results" in result.matchas) {
    job_count += result.matchas.results.length
    await incrementLbaJobsViewCount(result.matchas.results.flatMap((job) => (job?.id ? [job.id] : [])))
  }

  if (query.caller) {
    trackApiCall({ caller: query.caller, job_count, result_count: job_count, api_path: "jobV1/jobs", response: "OK" })
  }

  return result
}

export const formatRecruteurLbaToJobOpportunity = (recruteursLba: ILbaCompany[]): IJobOpportunity[] => {
  return recruteursLba.map((recruteurLba) => ({
    identifiant: {
      id: recruteurLba.siret,
      type: JOB_OPPORTUNITY_TYPE.RECRUTEURS_LBA,
    },
    contract: null,
    jobOffre: null,
    workplace: {
      description: null,
      name: recruteurLba.enseigne ?? recruteurLba.raison_sociale,
      siret: recruteurLba.siret,
      size: recruteurLba.company_size,
      website: recruteurLba.website,
      location: {
        address: `${recruteurLba.street_number} ${recruteurLba.street_name} ${recruteurLba.zip_code} ${recruteurLba.city}`,
        lattitude: parseFloat(recruteurLba.geo_coordinates.split(",")[0]),
        longitude: parseFloat(recruteurLba.geo_coordinates.split(",")[1]),
      },
      domaine: {
        opco: recruteurLba.opco,
        idcc: null,
        naf: {
          code: recruteurLba.naf_code,
          label: recruteurLba.naf_label,
        },
      },
    },
    apply: {
      url: `${config.publicUrl}/recherche-apprentissage?type=lba&itemId=${recruteurLba.siret}`,
      phone: recruteurLba.phone,
      email: recruteurLba.email,
    },
  }))
}

export const formatOffreEmploiLbaToJobOpportunity = (offresEmploiLba: IRecruiter[]): IJobOpportunity[] => {
  return offresEmploiLba.flatMap((offreEmploiLba) =>
    offreEmploiLba.jobs.map((job) => ({
      identifiant: {
        id: job._id,
        type: JOB_OPPORTUNITY_TYPE.OFFRES_EMPLOI_LBA,
      },
      contract: job.job_type,
      jobOffre: {
        title: job.rome_appellation_label!,
        start: job.job_start_date,
        duration: job.job_duration!,
        immediateStart: null,
        description: job.rome_detail!.definition!,
        diplomaLevelLabel: job.job_level_label!,
        desiredSkills: job.rome_detail!.competences.savoir_etre_professionnel!.map((x) => x.libelle),
        toBeAcquiredSkills: job.rome_detail!.competences.savoir_faire!.map((x) => ({ libelle: x.libelle, items: x.items.map((y) => y.libelle) })),
        accessCondition: job.rome_detail!.acces_metier,
        remote: null,
        publication: {
          creation: job.job_creation_date!,
          expiration: job.job_expiration_date!,
        },
        meta: {
          origin: offreEmploiLba.origin!,
          count: job.job_count!,
        },
      },
      workplace: {
        siret: offreEmploiLba.establishment_siret,
        name: offreEmploiLba.establishment_enseigne! ?? offreEmploiLba.establishment_raison_sociale!,
        description: null,
        size: offreEmploiLba.establishment_size!,
        website: null,
        location: {
          address: offreEmploiLba.address!,
          lattitude: offreEmploiLba.geopoint!.coordinates[1], // Changed lattitude to latitude
          longitude: offreEmploiLba.geopoint!.coordinates[0], // Correcting the order of coordinates
        },
        domaine: {
          idcc: Number(offreEmploiLba.idcc) ?? null,
          opco: offreEmploiLba.opco!,
          naf: {
            code: offreEmploiLba.naf_code!,
            label: offreEmploiLba.naf_label!,
          },
        },
      },
      apply: {
        url: `${config.publicUrl}/recherche-apprentissage?type=matcha&itemId=${job._id}`,
        phone: offreEmploiLba.phone!,
        email: offreEmploiLba.email,
      },
    }))
  )
}

export const formatFranceTravailToJobOpportunity = (offresEmploiFranceTravail: FTJob[]): IJobOpportunity[] => {
  return offresEmploiFranceTravail.map((offreFT) => ({
    identifiant: {
      id: offreFT.id,
      type: JOB_OPPORTUNITY_TYPE.OFFRES_EMPLOI_FRANCE_TRAVAIL,
    },
    contract: [offreFT.natureContrat],
    jobOffre: {
      title: offreFT.intitule,
      start: null,
      duration: offreFT.typeContratLibelle,
      immediateStart: null,
      description: offreFT.description,
      diplomaLevelLabel: null,
      desiredSkills: null,
      toBeAcquiredSkills: null,
      accessCondition: offreFT.formations ? offreFT.formations?.map((formation) => `${formation.domaineLibelle} - ${formation.niveauLibelle}`) : null,
      remote: null,
      publication: {
        creation: new Date(offreFT.dateCreation),
        expiration: null,
      },
      meta: {
        origin: null,
        count: offreFT.nombrePostes,
      },
    },
    workplace: {
      siret: null,
      name: offreFT.entreprise.nom,
      description: offreFT.entreprise.description,
      size: null,
      website: null,
      location: {
        address: offreFT.lieuTravail.libelle,
        longitude: parseFloat(offreFT.lieuTravail.longitude),
        lattitude: parseFloat(offreFT.lieuTravail.latitude),
      },
      domaine: {
        idcc: null,
        opco: null,
        naf: {
          code: offreFT.codeNAF ? offreFT.codeNAF : null,
          label: offreFT.secteurActiviteLibelle ? offreFT.secteurActiviteLibelle : null,
        },
      },
    },
    apply: {
      url: offreFT.origineOffre.partenaires[0].url ?? offreFT.origineOffre.urlOrigine,
      phone: null,
      email: null,
    },
  }))
}
