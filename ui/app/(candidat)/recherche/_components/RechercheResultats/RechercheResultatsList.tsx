"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useEffect, useMemo, useRef, useState } from "react"

import { RechercheResultatsFooter } from "@/app/(candidat)/recherche/_components/RechercheResultats/Footer"
import { ResultCard } from "@/app/(candidat)/recherche/_components/RechercheResultats/ResultatListCard"
import { Whisper } from "@/app/(candidat)/recherche/_components/RechercheResultats/Whisper"
import { RechercheResultatsPlaceholder } from "@/app/(candidat)/recherche/_components/RechercheResultatsPlaceholder"
import { useRechercheResults, type ILbaItem } from "@/app/(candidat)/recherche/_hooks/useRechercheResults"
import { useWhispers, type IWhisper } from "@/app/(candidat)/recherche/_hooks/useWhispers"
import { isItemReferenceInList, type WithRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"
import { ErrorMessage } from "@/components"
import ResultListsLoading from "@/components/SearchForTrainingsAndJobs/components/ResultListsLoading"
import { notifyJobSearchViewV3 } from "@/utils/api"

export function RechercheResultatsList(props: WithRecherchePageParams) {
  const result = useRechercheResults(props.params)
  const whispers = useWhispers(props.params)

  const parentRef = useRef(null)

  const items = useMemo((): Array<ILbaItem | IWhisper> => {
    if (result.status !== "success" && result.formationStatus !== "success") {
      return []
    }

    const data = []
    for (let i = 0; i < result.itemsCount; i++) {
      if (whispers.has(i)) {
        data.push(whispers.get(i))
      }
      data.push(result.items[i])
    }

    return data
  }, [result, whispers])

  const columnVirtualizer = useVirtualizer({
    count: items.length + 1,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      if (items[index]?.ideaType === "whisper") {
        return 112
      }

      return 270
    },
    overscan: 10,
  })

  useEffect(() => {
    const index = items.findIndex((item) => item.ideaType !== "whisper" && isItemReferenceInList(item, props.params.activeItems ?? []))
    // Scroll to top when search param changes
    columnVirtualizer.scrollToIndex(Math.max(index, 0), { align: "start" })
  }, [props.params, columnVirtualizer, items])

  const [notifyViewState, setNotifyViewState] = useState({ viewedItems: new Set<string>(), lastNotifyServer: new Date(0) })
  const notifiedViewedItems = useMemo(() => {
    if (typeof window === "undefined") return
    return new Set<string>()
  }, [])

  useEffect(() => {
    // limite les appels toutes les 2 secondes
    if (typeof window === "undefined" || new Date().getTime() - notifyViewState.lastNotifyServer.getTime() < 3_000 /* 3 secondes*/) return
    const idsToSend: string[] = []
    for (const id of notifyViewState.viewedItems) {
      if (!notifiedViewedItems.has(id)) {
        idsToSend.push(id)
      }
    }
    if (!idsToSend.length) {
      return
    }
    idsToSend.forEach((id) => {
      notifiedViewedItems.add(id)
    })
    setNotifyViewState({ viewedItems: new Set<string>(), lastNotifyServer: new Date() })
    notifyJobSearchViewV3(idsToSend)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnVirtualizer.getVirtualIndexes(), notifyViewState, notifiedViewedItems])

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
        {result.formationStatus === "success" && result.formationsCount > 0 && props.params.geo !== null && props.params.geo.radius < result.formations[0].place?.distance && (
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
                    <RechercheResultatsFooter jobStatus={result.jobStatus} searchParams={props.params} jobCount={result.jobStatus === "loading" ? 0 : result.jobsCount} />
                  </Box>
                )
              }

              const item = items[virtualRow.index]
              if (item.ideaType !== "whisper") {
                notifyViewState.viewedItems.add(item.id)
              }

              return (
                <Box
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={columnVirtualizer.measureElement}
                  sx={{
                    my: fr.spacing("1w"),
                    px: fr.spacing("1w"),
                  }}
                >
                  {item.ideaType === "whisper" ? (
                    <Whisper whisper={item} />
                  ) : (
                    <ResultCard active={isItemReferenceInList(item, props.params.activeItems ?? [])} item={item} params={props.params} />
                  )}
                </Box>
              )
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
