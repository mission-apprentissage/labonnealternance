import Boom from "boom"

import { IApiError } from "../common/utils/errorManager.js"
import { trackApiCall } from "../common/utils/sendTrackingEvent.js"

import { TJobSearchQuery, TLbaItemResult } from "./jobOpportunity.service.types.js"
import { getSomeCompanies } from "./lbacompany.service.js"
import { getLbaJobs } from "./lbajob.service.js"
import { getSomePeJobs } from "./pejob.service.js"
import { jobsQueryValidator } from "./queryValidator.service.js"

/**
 * Retourn la compilation d'opportunités d'emploi au format unifié
 * chaque type d'opportunités d'emploi peut être émis en succès même si d'autres groupes sont en erreur
 * @param {TJobQuery} query un objet contenant les paramètres de recherche
 * @param {string} api l'identifiant de l'api utilisée
 * @returns {Promise<IApiError | { peJobs: { results: ILbaItem[] } | IApiError, matchas: { results: ILbaItem[] } | IApiError, lbaCompanies: { results: ILbaItem[] } | IApiError, lbbCompanies: null}>}
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
  useMock,
  api = "jobV1/jobs",
}: {
  romes?: string
  referer?: string
  caller?: string
  latitude?: number
  longitude?: number
  radius?: number
  insee?: string
  sources?: string
  diploma?: string
  opco?: string
  opcoUrl?: string
  useMock?: boolean
  api?: string
}): Promise<
  | IApiError
  | { peJobs: TLbaItemResult; matchas: TLbaItemResult | null; lbaCompanies: TLbaItemResult | null; lbbCompanies: null }
  | { peJobs: TLbaItemResult | null; matchas: TLbaItemResult; lbaCompanies: TLbaItemResult | null; lbbCompanies: null }
  | { peJobs: TLbaItemResult | null; matchas: TLbaItemResult | null; lbaCompanies: TLbaItemResult; lbbCompanies: null }
> => {
  try {
    const jobSources = !sources ? ["lba", "offres", "matcha"] : sources.split(",")
    const finalRadius = radius ?? 0

    const [peJobs, lbaCompanies, matchas] = await Promise.all([
      jobSources.includes("offres")
        ? getSomePeJobs({
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
          })
        : null,
      jobSources.includes("lba")
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
            useMock,
          })
        : null,
      jobSources.includes("matcha")
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
            useMock,
          })
        : null,
    ])

    if (peJobs) {
      return { peJobs, matchas, lbaCompanies, lbbCompanies: null }
    }
    if (matchas) {
      return { peJobs, matchas, lbaCompanies, lbbCompanies: null }
    }
    if (lbaCompanies) {
      return { peJobs, matchas, lbaCompanies, lbbCompanies: null }
    }
    throw Boom.internal("All job sources are empty")
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
  | { peJobs: TLbaItemResult; matchas: TLbaItemResult | null; lbaCompanies: TLbaItemResult | null; lbbCompanies: null }
  | { peJobs: TLbaItemResult | null; matchas: TLbaItemResult; lbaCompanies: TLbaItemResult | null; lbbCompanies: null }
  | { peJobs: TLbaItemResult | null; matchas: TLbaItemResult | null; lbaCompanies: TLbaItemResult; lbbCompanies: null }
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
  }

  if (query.caller) {
    trackApiCall({ caller: query.caller, job_count, result_count: job_count, api_path: "jobV1/jobs", response: "OK" })
  }

  return result
}
