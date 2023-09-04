import { trackApiCall } from "../common/utils/sendTrackingEvent.js"
import { sentryCaptureException } from "../common/utils/sentryUtils.js"
import { getLbaJobs } from "./lbajob.service.js"
import { getSomeCompanies } from "./lbacompany.service.js"
import { jobsQueryValidator } from "./queryValidator.service.js"
import { getSomePeJobs } from "./pejob.service.js"
import { TJobSearchQuery } from "./jobOpportunity.service.types.js"
import { IApiError } from "../common/utils/errorManager.js"

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
  latitude?: string
  longitude?: string
  radius?: string
  insee?: string
  sources?: string
  diploma?: string
  opco?: string
  opcoUrl?: string
  useMock?: string
  api?: string
}) => {
  try {
    const jobSources = !sources ? ["lba", "offres", "matcha"] : sources.split(",")

    const [peJobs, lbaCompanies, lbbCompanies, matchas] = await Promise.all([
      jobSources.indexOf("offres") >= 0
        ? getSomePeJobs({
            romes: romes.split(","),
            insee: insee,
            radius: parseInt(radius),
            latitude,
            longitude,
            caller,
            diploma,
            api,
            opco,
            opcoUrl,
          })
        : null,
      jobSources.indexOf("lba") >= 0
        ? getSomeCompanies({
            romes,
            latitude,
            longitude,
            radius: parseInt(radius),
            referer,
            caller,
            api,
            opco,
            opcoUrl,
            useMock,
          })
        : null,
      null,
      jobSources.indexOf("matcha") >= 0
        ? getLbaJobs({
            romes,
            latitude,
            longitude,
            radius: parseInt(radius),
            api,
            caller,
            diploma,
            opco,
            opcoUrl,
            useMock,
          })
        : null,
    ])

    return { peJobs, matchas, lbaCompanies, lbbCompanies }
  } catch (err) {
    console.log("Error ", err.message)
    sentryCaptureException(err)

    if (caller) {
      trackApiCall({ caller, api_path: api, response: "Error" })
    }
    const errorReturn: IApiError = { error: "internal_error" }

    return errorReturn
  }
}

/**
 * Retourne la compilation d'offres partenaires, d'offres LBA et de sociétés issues de l'algo
 * ou une liste d'erreurs si les paramètres de la requête sont invalides
 * @param {TJobSearchQuery} query les paramètres de recherche
 * @returns {Promise<{ error: string, error_messages: string[] } | IApiError | { job_count: number, matchas: TLbaItemResult, peJobs: TLbaItemResult, lbaCompanies: TLbaItemResult, lbbCompanies: null }>}
 */
export const getJobsQuery = async (query: TJobSearchQuery) => {
  const queryValidationResult = await jobsQueryValidator(query)

  if ("error" in queryValidationResult) {
    return queryValidationResult
  }

  const result = await getJobsFromApi({ romes: queryValidationResult.romes, ...query })

  if ("error" in result) {
    return result
  }

  let job_count = 0

  if ("lbaCompanies" in result && "results" in result.lbaCompanies) {
    job_count += result.lbaCompanies.results.length
  }

  if ("peJobs" in result && "results" in result.peJobs) {
    job_count += result.peJobs.results.length
  }

  if ("matchas" in result && "results" in result.matchas) {
    job_count += result.matchas.results.length
  }

  if (query.caller) {
    trackApiCall({ caller: query.caller, job_count, result_count: job_count, api_path: "jobV1/jobs", response: "OK" })
  }

  return { ...result, job_count }
}
