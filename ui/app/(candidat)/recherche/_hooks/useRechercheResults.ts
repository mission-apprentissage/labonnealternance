import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import {
  IGetRoutes,
  ILbaItemFormation,
  ILbaItemFormationJson,
  ILbaItemLbaCompanyJson,
  ILbaItemLbaJob,
  ILbaItemLbaJobJson,
  ILbaItemPartnerJob,
  ILbaItemPartnerJobJson,
  IQuery,
  IResponse,
} from "shared"
import { Jsonify } from "type-fest"

import { IRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"
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
  items: ILbaItem[]
  jobs: Array<ILbaItemLbaCompanyJson | ILbaItemPartnerJobJson | ILbaItemLbaJobJson>
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

export function useRechercheResults(rechercheParams: IRecherchePageParams | null): IUseRechercheResults {
  const jobQuerystring = useMemo((): IQuery<IGetRoutes["/v1/_private/jobs/min"]> => {
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
    return query
  }, [rechercheParams])

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

  const isFormationEnabled = Boolean(formationQuerystring.romes.length > 0 && rechercheParams.displayFormations)
  const isJobsEnabled = Boolean((jobQuerystring.romes.length > 0 || jobQuerystring.rncp) && (rechercheParams.displayEntreprises || rechercheParams.displayPartenariats))

  const formationQuery = useQuery<Jsonify<ILbaItemFormation>[]>({
    queryKey: ["/v1/_private/formations/min", formationQuerystring],
    queryFn: async ({ signal }) => {
      return apiGet("/v1/_private/formations/min", { querystring: formationQuerystring }, { signal, priority: "high" })
    },
    enabled: isFormationEnabled,
    throwOnError: false,
    staleTime: 1000 * 60 * 60,
  })

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

  const result = useMemo(() => {
    const jobs: Array<ILbaItemLbaCompanyJson | ILbaItemPartnerJobJson | ILbaItemLbaJobJson> = []
    jobs.push(...jobQueryResult.lbaJobs)
    jobs.push(...jobQueryResult.partnerJobs)
    jobs.push(...jobQueryResult.lbaCompanies)

    const items: Array<ILbaItem> = []
    items.push(...formationQueryResult.formations)
    items.push(...jobs)

    const result: IUseRechercheResults = {
      status: reduceQueryStatus([jobQueryResult.status, formationQueryResult.status]),
      jobQuery: jobQueryResult,
      formationQuery: formationQueryResult,
      items,
      jobs,
    }
    return result
  }, [formationQueryResult, jobQueryResult])

  return result
}
