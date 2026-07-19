"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useMemo } from "react"
import { useSwipeable } from "react-swipeable"

import { buildHitDetailUrl, parseSearchPageParams } from "../_utils/search.params.utils"
import { useSearchResults } from "./useSearchResults"

export interface IBetaDetailNavigation {
  swipeHandlers: ReturnType<typeof useSwipeable>
  goPrev?: () => void
  goNext?: () => void
  handleClose: () => void
}

/**
 * Navigation des pages de détail quand on ARRIVE DU NOUVEAU MOTEUR : les cartes de
 * /beta/recherche posent `?from=<url de recherche>` sur l'URL de détail. Le hook rejoue la
 * même recherche (cache react-query partagé avec la page de résultats → généralement
 * instantané) pour naviguer entre les résultats, et « fermer » revient sur `from`.
 *
 * Renvoie `null` quand la page n'a pas été ouverte depuis le nouveau moteur : les pages de
 * détail retombent alors sur la navigation legacy (useBuildNavigation + /recherche).
 */
export function useBetaDetailNavigation(): IBetaDetailNavigation | null {
  const router = useRouter()
  const routeParams = useParams()
  const searchParams = useSearchParams()

  const from = searchParams?.get("from") ?? null
  const isFromBeta = from !== null && from.startsWith("/beta/recherche")

  const betaSearchParams = useMemo(() => new URLSearchParams(isFromBeta ? (from.split("?")[1] ?? "") : ""), [isFromBeta, from])
  const params = useMemo(() => parseSearchPageParams(betaSearchParams), [betaSearchParams])

  const result = useSearchResults(params, { enabled: isFromBeta })

  // Le segment [id] des pages de détail EST le url_id des hits (posé par buildHitDetailUrl,
  // qui l'encode — useParams renvoie le segment brut, encore encodé).
  const rawId = typeof routeParams?.id === "string" ? routeParams.id : null
  let currentUrlId: string | null = rawId
  try {
    currentUrlId = rawId === null ? null : decodeURIComponent(rawId)
  } catch {
    // segment non décodable : on compare la valeur brute
  }

  const { goPrev, goNext } = useMemo(() => {
    if (!isFromBeta || !from) return {}
    const hits = result.data?.pages.flatMap((page) => page.hits) ?? []
    if (hits.length <= 1) return {}
    const currentIndex = currentUrlId ? hits.findIndex((hit) => hit.url_id === currentUrlId) : 0
    if (currentIndex === -1) return {}
    // Même convention que le legacy (useBuildNavigation) : navigation circulaire sur la liste.
    const goToIndex = (index: number) => {
      const hit = hits[index]
      if (!hit) return undefined
      return () => router.push(buildHitDetailUrl({ sub_type: hit.sub_type ?? "", url_id: hit.url_id ?? "", title: hit.title ?? "" }, from))
    }
    return {
      goNext: goToIndex((currentIndex + 1) % hits.length),
      goPrev: goToIndex(currentIndex === 0 ? hits.length - 1 : currentIndex - 1),
    }
  }, [isFromBeta, from, result.data, currentUrlId, router])

  const swipeHandlers = useSwipeable({
    onSwiped: (eventData) => {
      if (eventData.dir === "Right") goPrev?.()
      else if (eventData.dir === "Left") goNext?.()
    },
  })

  if (!isFromBeta || !from) return null

  return {
    swipeHandlers,
    goPrev,
    goNext,
    handleClose: () => router.push(from),
  }
}
