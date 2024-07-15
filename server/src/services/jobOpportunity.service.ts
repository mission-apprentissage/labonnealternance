import { ILbaCompany } from "shared"
import { JOB_OPPORTUNITY_TYPE, LBA_ITEM_TYPE, allLbaItemType } from "shared/constants/lbaitem"
import { IJobOpportunity } from "shared/interface/jobOpportunity.types"

import { IApiError } from "../common/utils/errorManager"
import { trackApiCall } from "../common/utils/sendTrackingEvent"

import { getSomeFtJobs } from "./ftjob.service"
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
  const formattedResult: IJobOpportunity[] = []
  recruteursLba.map((recruteurLba) => {
    formattedResult.push({
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
          lattitude: recruteurLba.geo_coordinates.split(",")[0],
          longitude: recruteurLba.geo_coordinates.split(",")[1],
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
        url: null,
        phone: recruteurLba.phone,
        email: recruteurLba.email,
      },
    })
  })
  return formattedResult
}
