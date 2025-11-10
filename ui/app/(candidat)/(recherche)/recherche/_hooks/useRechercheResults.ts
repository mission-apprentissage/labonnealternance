import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import type {
  IGetRoutes,
  ILbaItemFormationJson,
  ILbaItemLbaCompanyJson,
  ILbaItemLbaJob,
  ILbaItemLbaJobJson,
  ILbaItemPartnerJob,
  ILbaItemPartnerJobJson,
  IQuery,
  IResponse,
} from "shared"

import type { IRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { apiGet } from "@/utils/api.utils"

export type QueryStatus = "success" | "error" | "disabled" | "loading"

export type ILbaItem = ILbaItemLbaCompanyJson | ILbaItemPartnerJobJson | ILbaItemFormationJson | ILbaItemLbaJobJson

export type IUseRechercheResultsFormations = {
  status: QueryStatus
  formations: Array<ILbaItemFormationJson>
  errorMessage: string | null
}

export type IUseRechercheResultsJobs = {
  status: QueryStatus
  lbaCompanies: Array<ILbaItemLbaCompanyJson>
  partnerJobs: Array<ILbaItemPartnerJobJson>
  lbaJobs: Array<ILbaItemLbaJobJson>
  errorMessage: string | null
}

export type IUseRechercheResults = {
  status: QueryStatus
  jobQuery: IUseRechercheResultsJobs
  formationQuery: IUseRechercheResultsFormations
  displayedJobs: Array<ILbaItemLbaCompanyJson | ILbaItemPartnerJobJson | ILbaItemLbaJobJson>
  displayedFormations: Array<ILbaItemFormationJson>
  displayedItems: Array<ILbaItemLbaCompanyJson | ILbaItemPartnerJobJson | ILbaItemLbaJobJson | ILbaItemFormationJson>
  elligibleHandicapCount: number
}

const statusPriorities: QueryStatus[] = ["error", "loading", "success", "disabled"]
function reduceQueryStatus(status: QueryStatus[]): QueryStatus {
  return status.reduce((acc, value) => {
    const accPriority = statusPriorities.indexOf(acc)
    const valuePriority = statusPriorities.indexOf(value)
    return accPriority < valuePriority ? acc : value
  }, "disabled")
}

function getQueryStatus(query: ReturnType<typeof useQuery>, isEnabled: boolean): "success" | "error" | "disabled" | "loading" {
  const isQueryDisabled = query.isLoading && query.fetchStatus === "idle"
  if (isQueryDisabled || !isEnabled) {
    return "disabled"
  }
  if (query.isLoading) {
    return "loading"
  }
  if (query.isError) {
    return "error"
  }
  return "success"
}

function isPartialJobError(data?: IResponse<IGetRoutes["/v1/_private/jobs/min"]>): boolean {
  if (!data) {
    return null
  }

  const errors = ["error" in data.lbaJobs, "error" in data.lbaCompanies, "error" in data.partnerJobs]

  return errors.some(Boolean)
}

function rechercheParamsToJobQueryString(rechercheParams: IRecherchePageParams | null): IQuery<IGetRoutes["/v1/_private/jobs/min"]> {
  if (!rechercheParams) return {}

  const query: IQuery<IGetRoutes["/v1/_private/jobs/min"]> = {
    romes: rechercheParams.romes.join(","),
  }

  if (rechercheParams.geo) {
    query.longitude = rechercheParams.geo.longitude
    query.latitude = rechercheParams.geo.latitude
    query.radius = rechercheParams.radius
  }

  if (rechercheParams.diploma) {
    query.diploma = rechercheParams.diploma
  }

  if (rechercheParams.opco) {
    query.opco = rechercheParams.opco
  }

  if (rechercheParams.rncp) {
    query.rncp = rechercheParams.rncp
  }
  if (rechercheParams.elligibleHandicapFilter) {
    query.elligibleHandicapFilter = "true"
  }
  return query
}

function useJobQuery(rechercheParams: IRecherchePageParams | null) {
  const { isJobsEnabled, queryString: jobQuerystring } = useMemo(() => {
    const queryString = rechercheParamsToJobQueryString(rechercheParams)
    const isJobsEnabled = Boolean((queryString.romes.length > 0 || queryString.rncp) && (rechercheParams.displayEntreprises || rechercheParams.displayPartenariats))
    return { isJobsEnabled, queryString }
  }, [rechercheParams])

  const jobQuery = useQuery({
    queryKey: ["/v1/_private/jobs/min", jobQuerystring],
    queryFn: async ({ signal }) => {
      return apiGet("/v1/_private/jobs/min", { querystring: jobQuerystring }, { signal, priority: "high" })
    },
    enabled: isJobsEnabled,
    throwOnError: false,
    staleTime: 1000 * 60 * 60,
  })

  const jobQueryResult = useMemo(() => {
    const queryStatus = getQueryStatus(jobQuery, isJobsEnabled)
    if (queryStatus === "disabled") {
      const jobQueryResult: IUseRechercheResultsJobs = {
        status: queryStatus,
        lbaJobs: [],
        lbaCompanies: [],
        partnerJobs: [],
        errorMessage: null,
      }
      return jobQueryResult
    }

    const lbaJobs: ILbaItemLbaJobJson[] = []
    const partnerJobs: ILbaItemPartnerJobJson[] = []
    const lbaCompanies: ILbaItemLbaCompanyJson[] = []

    const jobData = jobQuery.data
    if (jobData) {
      if (jobData.lbaJobs && "results" in jobData.lbaJobs) {
        lbaJobs.push(
          ...[
            ...(jobData.lbaJobs.results as any[]).filter((job: ILbaItemLbaJob) => {
              if (job.company.mandataire) {
                return rechercheParams.displayPartenariats
              }
              return rechercheParams.displayEntreprises
            }),
          ].sort((a: ILbaItemLbaJob, b: ILbaItemLbaJob) => {
            return a.place.distance - b.place.distance
          })
        )
      }
      if (rechercheParams.displayEntreprises && jobData.partnerJobs && "results" in jobData.partnerJobs) {
        partnerJobs.push(
          ...[...(jobData.partnerJobs.results as any)].sort((a: ILbaItemPartnerJob, b: ILbaItemPartnerJob) => {
            return a.place.distance - b.place.distance
          })
        )
      }

      if (rechercheParams.displayEntreprises && jobData.lbaCompanies && "results" in jobData.lbaCompanies) {
        lbaCompanies.push(...jobData.lbaCompanies.results)
      }
    }

    const jobQueryResult: IUseRechercheResultsJobs = {
      status: getQueryStatus(jobQuery, isJobsEnabled),
      lbaJobs,
      partnerJobs,
      lbaCompanies,
      errorMessage:
        queryStatus === "error"
          ? "Problème momentané d'accès aux opportunités d'emploi"
          : isPartialJobError(jobQuery.data)
            ? "Problème momentané d'accès à certaines opportunités d'emploi"
            : null,
    }
    return jobQueryResult
  }, [isJobsEnabled, jobQuery, rechercheParams.displayEntreprises, rechercheParams.displayPartenariats])
  return { jobQueryResult }
}

function useFormationQuery(rechercheParams: IRecherchePageParams | null) {
  const formationQuerystring = useMemo((): IQuery<IGetRoutes["/v1/_private/formations/min"]> => {
    const query: IQuery<IGetRoutes["/v1/_private/formations/min"]> = {
      romes: rechercheParams.romes.join(","),
    }

    if (rechercheParams.geo) {
      query.longitude = rechercheParams.geo.longitude
      query.latitude = rechercheParams.geo.latitude
      query.radius = rechercheParams.radius
    }

    if (rechercheParams.diploma) {
      query.diploma = rechercheParams.diploma
    }

    return query
  }, [rechercheParams])

  const isFormationEnabled = Boolean(rechercheParams.displayFormations && formationQuerystring.romes.length > 0)

  const formationQuery = useQuery<ILbaItemFormationJson[]>({
    queryKey: ["/v1/_private/formations/min", formationQuerystring],
    queryFn: async ({ signal }) => {
      return apiGet("/v1/_private/formations/min", { querystring: formationQuerystring }, { signal, priority: "high" })
    },
    enabled: isFormationEnabled,
    throwOnError: false,
    staleTime: 1000 * 60 * 60,
  })

  const formationQueryResult = useMemo(() => {
    const queryStatus = getQueryStatus(formationQuery, isFormationEnabled)
    if (queryStatus === "disabled") {
      const formationQueryResult: IUseRechercheResultsFormations = {
        status: queryStatus,
        formations: [],
        errorMessage: null,
      }
      return formationQueryResult
    }
    const formations = formationQuery.data || []
    const formationQueryResult: IUseRechercheResultsFormations = {
      status: queryStatus,
      formations,
      errorMessage: queryStatus === "error" ? "Oups ! Les résultats formation ne sont pas disponibles actuellement !" : null,
    }
    return formationQueryResult
  }, [formationQuery, isFormationEnabled])

  return { formationQueryResult }
}

export function useRechercheResults(rechercheParams: IRecherchePageParams | null): IUseRechercheResults {
  const { jobQueryResult: allJobQueryResult } = useJobQuery({ ...rechercheParams, elligibleHandicapFilter: false })
  const { jobQueryResult: handicapJobQueryResult } = useJobQuery({ ...rechercheParams, elligibleHandicapFilter: true })
  const { formationQueryResult } = useFormationQuery(rechercheParams)

  const result = useMemo(() => {
    const selectedJobQuery = rechercheParams.elligibleHandicapFilter ? handicapJobQueryResult : allJobQueryResult

    const allJobs = [...allJobQueryResult.lbaJobs, ...allJobQueryResult.partnerJobs, ...allJobQueryResult.lbaCompanies]
    const handicapJobs = [...handicapJobQueryResult.lbaJobs, ...handicapJobQueryResult.partnerJobs, ...handicapJobQueryResult.lbaCompanies]

    let displayedJobs: Array<ILbaItemLbaCompanyJson | ILbaItemPartnerJobJson | ILbaItemLbaJobJson> = rechercheParams.elligibleHandicapFilter ? handicapJobs : allJobs

    if (!rechercheParams.displayPartenariats) {
      displayedJobs = displayedJobs.filter((item) => {
        if ("company" in item) {
          return !item.company.mandataire
        }
        return true
      })
    }

    const displayedFormations = rechercheParams.elligibleHandicapFilter ? [] : formationQueryResult.formations

    const elligibleHandicapCount = handicapJobs.length

    const result: IUseRechercheResults = {
      status: reduceQueryStatus([selectedJobQuery.status, formationQueryResult.status]),
      jobQuery: allJobQueryResult,
      formationQuery: formationQueryResult,
      displayedJobs,
      displayedFormations,
      displayedItems: [...displayedFormations, ...displayedJobs],
      elligibleHandicapCount,
    }
    return result
  }, [rechercheParams.elligibleHandicapFilter, rechercheParams.displayPartenariats, handicapJobQueryResult, allJobQueryResult, formationQueryResult])

  return result
}
