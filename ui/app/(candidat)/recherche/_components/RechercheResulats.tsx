"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useEffect, useMemo, useRef } from "react"
import { useQuery } from "react-query"
import { IGetRoutes, ILbaItemFormation, ILbaItemLbaCompany, ILbaItemLbaJob, ILbaItemPartnerJob, IQuery } from "shared"

import { RechercheResultatsFooter } from "@/app/(candidat)/recherche/_components/RechercheResultats/Footer"
import { RechercheResultatsPlaceholder } from "@/app/(candidat)/recherche/_components/RechercheResultatsPlaceholder"
import { ResultatListCard } from "@/app/(candidat)/recherche/_components/ResultatListCard"
import { useCandidatRechercheParams } from "@/app/(candidat)/recherche/_hooks/useCandidatRechercheParams"
import { ErrorMessage } from "@/components"
import ResultListsLoading from "@/components/SearchForTrainingsAndJobs/components/ResultListsLoading"
import { apiGet } from "@/utils/api.utils"

export function RechercheResulats() {
  const params = useCandidatRechercheParams()

  const jobQuerystring = useMemo((): IQuery<IGetRoutes["/v1/_private/jobs/min"]> => {
    const query: IQuery<IGetRoutes["/v1/_private/jobs/min"]> = {
      romes: params.romes.join(","),
      sources: params.displayEntreprises || params.displayPartenariats ? "lba,matcha,partnerJob" : "",
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

  const formationQuery = useQuery<ILbaItemFormation[]>({
    queryKey: ["/v1/_private/formations/min", formationQuerystring],
    queryFn: async ({ signal }) => {
      return apiGet("/v1/_private/formations/min", { querystring: formationQuerystring }, { signal, priority: "high" })
    },
    enabled: formationQuerystring.romes.length > 0 && params.displayFormations,
    useErrorBoundary: false,
    staleTime: 1000 * 60 * 5,
  })

  const jobQuery = useQuery({
    queryKey: ["/v1/_private/jobs/min", jobQuerystring],
    queryFn: async ({ signal }) => {
      return apiGet("/v1/_private/jobs/min", { querystring: jobQuerystring }, { signal, priority: "high" })
    },
    enabled: jobQuerystring.romes.length > 0 && jobQuerystring.sources.length > 0,
    useErrorBoundary: false,
    staleTime: 1000 * 60 * 5,
  })

  const jobs = useMemo(() => {
    const result: Array<ILbaItemLbaCompany | ILbaItemPartnerJob> = []

    if (jobQuery.data?.matchas && "results" in jobQuery.data.matchas) {
      result.push(
        ...jobQuery.data.matchas.results
          .filter((job: ILbaItemLbaJob) => {
            if (job.company.mandataire) {
              return params.displayPartenariats
            }
            return params.displayEntreprises
          })
          .toSorted((a: ILbaItemLbaJob, b: ILbaItemLbaJob) => {
            return a.place.distance - b.place.distance
          })
      )
    }

    if (jobQuery.data?.partnerJobs && "results" in jobQuery.data.partnerJobs) {
      result.push(
        ...jobQuery.data.partnerJobs.results.toSorted((a: ILbaItemPartnerJob, b: ILbaItemPartnerJob) => {
          return a.place.distance - b.place.distance
        })
      )
    }

    if (jobQuery.data?.lbaCompanies && "results" in jobQuery.data.lbaCompanies) {
      result.push(...jobQuery.data.lbaCompanies.results)
    }

    return result
  }, [jobQuery.data, params.displayPartenariats, params.displayEntreprises])

  const items = useMemo(() => {
    const result: Array<ILbaItemLbaCompany | ILbaItemPartnerJob | ILbaItemFormation> = []

    if (formationQuery.data && params.displayFormations) {
      result.push(...formationQuery.data)
    }

    if (jobs.length > 0) {
      result.push(...jobs)
    }

    return result
  }, [jobs, formationQuery.data, params.displayEntreprises, params.displayFormations])

  const jobErrorMessage = useMemo(() => {
    if (jobQuery.isError) {
      return "Problème momentané d'accès aux opportunités d'emploi"
    }

    if (!jobQuery.data) {
      return null
    }

    const errors = ["error" in jobQuery.data.matchas, "error" in jobQuery.data.lbaCompanies, "error" in jobQuery.data.partnerJobs]

    if (errors.every(Boolean)) {
      return "Problème momentané d'accès à certaines opportunités d'emploi"
    }

    if (errors.some(Boolean)) {
      return "Problème momentané d'accès à certaines opportunités d'emploi"
    }
    return null
  }, [jobQuery.isError, jobQuery.data])
  const parentRef = useRef(null)

  const columnVirtualizer = useVirtualizer({
    count: items.length + 1,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 10,
  })

  useEffect(() => {
    // Scroll to top when search param changes
    columnVirtualizer.scrollToIndex(0)
  }, [params, columnVirtualizer])

  if (jobQuery.isIdle && formationQuery.isIdle) {
    return <RechercheResultatsPlaceholder />
  }

  if (jobQuery.isError && formationQuery.isError) {
    return <ErrorMessage message="Erreur technique momentanée" type="column" />
  }

  if (formationQuery.isLoading) {
    return <ResultListsLoading isJobSearchLoading={jobQuery.isLoading} isTrainingSearchLoading={formationQuery.isLoading} />
  }

  const virtualItems = columnVirtualizer.getVirtualItems()

  const isSearchingJobs = jobQuery.isSuccess && (params.displayEntreprises || params.displayPartenariats)

  return (
    <Box
      ref={parentRef}
      sx={{
        overflow: "auto",
        height: "100%",
        width: "100%",
        contain: "strict",
        pb: fr.spacing("10w"),
      }}
    >
      <Box sx={{ maxWidth: "xl", margin: "auto" }}>
        {formationQuery.isError && <ErrorMessage message="Oups ! Les résultats formation ne sont pas disponibles actuellement !" />}
        {jobErrorMessage && <ErrorMessage message={jobErrorMessage} />}

        {formationQuery.isSuccess && formationQuery.data.length === 0 && (
          <Box mx={6} textAlign="center" my={2} fontWeight={700}>
            Aucune formation en alternance disponible pour ce métier
          </Box>
        )}
        {formationQuery.isSuccess && params.geo !== null && formationQuery.data.length > 0 && params.geo.radius < formationQuery.data[0].place?.distance && (
          <Box fontWeight={700} textAlign="center" mx={4} my={2}>
            Aucune formation ne correspondait à votre zone de recherche, nous avons trouvé les plus proches
          </Box>
        )}
      </Box>

      <Box>
        {virtualItems.length > 0 && (
          <Box
            sx={{
              maxWidth: "xl",
              height: columnVirtualizer.getTotalSize(),
              width: "100%",
              position: "relative",
              margin: "auto",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItems[0]?.start ?? 0}px)`,
              }}
            >
              {virtualItems.map((virtualRow) => {
                if (virtualRow.index >= items.length) {
                  return (
                    <Box
                      key={virtualRow.key}
                      data-index={virtualRow.index}
                      ref={columnVirtualizer.measureElement}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: fr.spacing("3w"),
                        my: fr.spacing("3w"),
                        alignItems: "center",
                      }}
                    >
                      <RechercheResultatsFooter isLoadingJob={jobQuery.isLoading} isSearchingJobs={isSearchingJobs} searchParams={params} jobCount={jobs.length} />
                    </Box>
                  )
                }

                function handleSelectItem(): void {
                  throw new Error("Function not implemented.")
                }

                return (
                  <Box key={virtualRow.key} data-index={virtualRow.index} ref={columnVirtualizer.measureElement}>
                    <ResultatListCard item={items[virtualRow.index]} handleSelectItem={handleSelectItem} />
                  </Box>
                )
              })}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  )
}
