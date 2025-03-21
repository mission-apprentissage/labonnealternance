import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import {
  IGetRoutes,
  ILbaItemFormation,
  ILbaItemFormationJson,
  ILbaItemLbaCompany,
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

export type ILbaItem = ILbaItemLbaCompanyJson | ILbaItemPartnerJobJson | ILbaItemFormationJson | ILbaItemLbaJobJson

type IUseRechercheResultsIdle = {
  status: "idle"
  formationStatus: "idle"
  jobStatus: "idle"
  itemsCount: 0
}

type IUseRechercheResultLoading = {
  status: "loading"
  formationStatus: "loading"
  jobStatus: "success" | "error" | "disabled" | "loading"

  itemsCount: 0
}

type IUseRechercheResultLoadingJobs = {
  status: "loading"

  formationStatus: "success" | "error" | "disabled"
  jobStatus: "loading"

  items: Array<ILbaItemFormationJson>
  itemsCount: number

  formations: Array<ILbaItemFormationJson>

  formationsCount: number

  nonBlockingErrors: {
    formations: string | null
    jobs: string | null
  }
}

export type IUseRechercheResultsSuccess = {
  status: "success"

  formationStatus: "success" | "error" | "disabled"
  jobStatus: "success" | "error" | "disabled"

  items: Array<ILbaItem>
  itemsCount: number
  formations: Array<ILbaItemFormationJson>
  jobs: Array<ILbaItemLbaCompanyJson | ILbaItemPartnerJobJson | ILbaItemLbaJobJson>

  nonBlockingErrors: {
    formations: string | null
    jobs: string | null
  }

  jobsCount: number
  entrepriseCount: number
  partenariatCount: number
  formationsCount: number
}

type IUseRechercheResultsError = {
  status: "error"

  formationStatus: "error" | "disabled"
  jobStatus: "error" | "disabled"
  itemsCount: 0
}

export type IUseRechercheResults = IUseRechercheResultsIdle | IUseRechercheResultLoading | IUseRechercheResultLoadingJobs | IUseRechercheResultsSuccess | IUseRechercheResultsError

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

  const errors = ["error" in data.matchas, "error" in data.lbaCompanies, "error" in data.partnerJobs]

  return errors.some(Boolean)
}

export function useRechercheResults(params: Required<IRecherchePageParams> | null): IUseRechercheResults {
  const jobQuerystring = useMemo((): IQuery<IGetRoutes["/v1/_private/jobs/min"]> => {
    const query: IQuery<IGetRoutes["/v1/_private/jobs/min"]> = {
      romes: params.romes.join(","),
      sources: "lba,matcha,partnerJob",
    }

    if (params.geo) {
      query.longitude = params.geo.longitude
      query.latitude = params.geo.latitude
      query.radius = params.geo.radius
    }

    if (params.diploma) {
      query.diploma = params.diploma
    }

    return query
  }, [params])

  const formationQuerystring = useMemo((): IQuery<IGetRoutes["/v1/_private/formations/min"]> => {
    const query: IQuery<IGetRoutes["/v1/_private/formations/min"]> = {
      romes: params.romes.join(","),
    }

    if (params.geo) {
      query.longitude = params.geo.longitude
      query.latitude = params.geo.latitude
      query.radius = params.geo.radius
    }

    if (params.diploma) {
      query.diploma = params.diploma
    }

    return query
  }, [params])

  const isFormationEnabled = formationQuerystring.romes.length > 0 && params.displayFormations
  const isJobsEnabled = jobQuerystring.romes.length > 0 && (params.displayEntreprises || params.displayPartenariats)

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

  const jobs = useMemo(() => {
    const result: Array<Jsonify<ILbaItemLbaCompany | ILbaItemPartnerJob | ILbaItemLbaJob>> = []

    if (!jobQuery.isSuccess || !isJobsEnabled) {
      return result
    }

    if (jobQuery.data.matchas && "results" in jobQuery.data.matchas) {
      result.push(
        ...jobQuery.data.matchas.results
          // @ts-ignore TODO
          .filter((job: ILbaItemLbaJob) => {
            if (job.company.mandataire) {
              return params.displayPartenariats
            }
            return params.displayEntreprises
          })
          // @ts-ignore TODO
          .toSorted((a: ILbaItemLbaJob, b: ILbaItemLbaJob) => {
            return a.place.distance - b.place.distance
          })
      )
    }

    if (!params.displayEntreprises) {
      return result
    }

    if (jobQuery.data.partnerJobs && "results" in jobQuery.data.partnerJobs) {
      result.push(
        // @ts-ignore TODO
        ...jobQuery.data.partnerJobs.results.toSorted((a: ILbaItemPartnerJob, b: ILbaItemPartnerJob) => {
          return a.place.distance - b.place.distance
        })
      )
    }

    if (jobQuery.data.lbaCompanies && "results" in jobQuery.data.lbaCompanies) {
      result.push(...jobQuery.data.lbaCompanies.results)
    }

    return result
  }, [jobQuery.data, jobQuery.isSuccess, isJobsEnabled, params.displayPartenariats, params.displayEntreprises])

  const formations = useMemo((): ILbaItemFormationJson[] => {
    return formationQuery.data && isFormationEnabled ? formationQuery.data : []
  }, [formationQuery.data, isFormationEnabled])

  const items = useMemo(() => {
    const result: Array<ILbaItem> = []

    if (formations.length > 0) {
      result.push(...formations)
    }

    if (jobs.length > 0) {
      result.push(...jobs)
    }

    return result
  }, [jobs, formations])

  const formationStatus = getQueryStatus(formationQuery, isFormationEnabled)
  const jobStatus = getQueryStatus(jobQuery, isJobsEnabled)

  return useMemo(() => {
    if (!isFormationEnabled && !isJobsEnabled) {
      return { status: "idle", formationStatus: "idle", jobStatus: "idle", itemsCount: 0 }
    }

    if ((formationStatus === "error" || formationStatus === "disabled") && (jobStatus === "error" || jobStatus === "disabled")) {
      return { status: "error", formationStatus, jobStatus, itemsCount: 0 }
    }

    if (formationStatus === "loading") {
      return { status: "loading", formationStatus, jobStatus, itemsCount: 0 }
    }

    const nonBlockingErrors = {
      formations: formationStatus === "error" ? "Oups ! Les résultats formation ne sont pas disponibles actuellement !" : null,
      jobs:
        jobStatus === "error"
          ? "Problème momentané d'accès aux opportunités d'emploi"
          : isPartialJobError(jobQuery.data)
            ? "Problème momentané d'accès à certaines opportunités d'emploi"
            : null,
    }

    if (jobStatus === "loading") {
      return {
        status: "loading",
        formationStatus,
        jobStatus,
        items: formations,
        itemsCount: formations.length,
        formations,
        formationsCount: formations.length,
        nonBlockingErrors,
      }
    }

    return {
      status: "success",
      formationStatus,
      jobStatus,
      items,
      itemsCount: items.length,
      nonBlockingErrors,
      jobs,
      jobsCount: jobs.length,
      formations,
      formationsCount: formations.length,
      entrepriseCount: jobs.filter((item) => !item.company.mandataire).length,
      partenariatCount: jobs.filter((item) => item.company.mandataire).length,
    }
  }, [jobQuery.data, isFormationEnabled, isJobsEnabled, jobs, formations, items, formationStatus, jobStatus])
}
