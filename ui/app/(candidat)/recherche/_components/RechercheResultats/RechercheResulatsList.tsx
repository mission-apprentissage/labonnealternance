"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import { useVirtualizer, } from "@tanstack/react-virtual"
import { useEffect, useMemo, useRef } from "react"

import { RechercheResultatsFooter } from "@/app/(candidat)/recherche/_components/RechercheResultats/Footer"
import { ResultCard } from "@/app/(candidat)/recherche/_components/RechercheResultats/ResultatListCard"
import { RechercheResultatsPlaceholder } from "@/app/(candidat)/recherche/_components/RechercheResultatsPlaceholder"
import { useCandidatRechercheParams } from "@/app/(candidat)/recherche/_hooks/useCandidatRechercheParams"
import { useRechercheResults } from "@/app/(candidat)/recherche/_hooks/useRechercheResults"
import { ErrorMessage } from "@/components"
import ResultListsLoading from "@/components/SearchForTrainingsAndJobs/components/ResultListsLoading"

export function RechercheResulatsList() {
  const params = useCandidatRechercheParams()
  const result = useRechercheResults(params)

  const parentRef = useRef(null)

  const columnVirtualizer = useVirtualizer({
    count: result.itemsCount + 1,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 278,
    overscan: 10,
  })

  const items = useMemo(() => {
    return result.status === "success" || result.formationStatus === "success" ? result.items : []
  }, [result])

  useEffect(() => {
    const index = items.findIndex((item) => params.selection?.includes(item.id))
    // Scroll to top when search param changes
    columnVirtualizer.scrollToIndex(Math.max(index, 0), { align: "start" })
  }, [params, columnVirtualizer, items])

  if (result.status === "idle") {
    return <RechercheResultatsPlaceholder />
  }

  if (result.status === "error") {
    return <ErrorMessage message="Erreur technique momentanée" type="column" />
  }

  if (result.formationStatus === "loading") {
    return <ResultListsLoading isJobSearchLoading={result.jobStatus === "loading"} isTrainingSearchLoading />
  }

  const virtualItems = columnVirtualizer.getVirtualItems()

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
        {result.nonBlockingErrors.formations && <ErrorMessage message={result.nonBlockingErrors.formations} />}
        {result.nonBlockingErrors.jobs && <ErrorMessage message={result.nonBlockingErrors.jobs} />}

        {result.formationStatus === "success" && result.formationsCount === 0 && (
          <Box mx={6} textAlign="center" my={2} fontWeight={700}>
            Aucune formation en alternance disponible pour ce métier
          </Box>
        )}
        {result.formationStatus === "success" && result.formationsCount > 0 && params.geo !== null && params.geo.radius < result.formations[0].place?.distance && (
          <Box fontWeight={700} textAlign="center" mx={4} my={2}>
            Aucune formation ne correspondait à votre zone de recherche, nous avons trouvé les plus proches
          </Box>
        )}
      </Box>

      <Box>
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
              if (virtualRow.index >= result.itemsCount) {
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
                    <RechercheResultatsFooter jobStatus={result.jobStatus} searchParams={params} jobCount={result.jobStatus === "loading" ? 0 : result.jobsCount} />
                  </Box>
                )
              }

              const item = result.items[virtualRow.index]

              return (
                <Box key={virtualRow.key} data-index={virtualRow.index} ref={columnVirtualizer.measureElement} sx={{
                  my: fr.spacing('1w'),
                  px: fr.spacing('1w')
                }}>
                  <ResultCard selected={params.selection?.includes(item.id)} item={item} />
                </Box>
              )
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
