"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useMemo } from "react"
import { useSwipeable } from "react-swipeable"

import { buildHitDetailUrl, parseSearchPageParams } from "../_utils/search.params.utils"
import { useSearchResults } from "./use-search-results"

export interface IDetailNavigation {
  swipeHandlers: ReturnType<typeof useSwipeable>
  goPrev?: () => void
  goNext?: () => void
  /** null quand la page n'a pas été ouverte depuis le moteur de recherche : le call-site fournit son propre repli */
  handleClose: (() => void) | null
  /** Position 1-based de l'item courant dans les résultats de recherche (télémétrie), null hors contexte recherche */
  position: number | null
}

/**
 * Navigation des pages de détail quand on ARRIVE DU MOTEUR DE RECHERCHE : les cartes de
 * /recherche posent `?from=<url de recherche>` sur l'URL de détail. Le hook rejoue la
 * même recherche (cache react-query partagé avec la page de résultats → généralement
 * instantané) pour naviguer entre les résultats, et « fermer » revient sur `from`.
 *
 * Sans `?from=` (lien partagé, entrée SEO, lien espace-pro), il n'y a pas de contexte de
 * liste : pas de précédent/suivant, et `handleClose` est null — les pages de détail
 * fournissent leur propre repli (retour à /recherche).
 */
export function useDetailNavigation(): IDetailNavigation {
  const router = useRouter()
  const routeParams = useParams()
  const searchParams = useSearchParams()

  const from = searchParams?.get("from") ?? null
  const isFromSearch = from !== null && from.startsWith("/recherche")

  const fromSearchParams = useMemo(() => new URLSearchParams(isFromSearch ? (from.split("?")[1] ?? "") : ""), [isFromSearch, from])
  const params = useMemo(() => parseSearchPageParams(fromSearchParams), [fromSearchParams])

  const result = useSearchResults(params, { enabled: isFromSearch })

  // Le segment [id] des pages de détail EST le url_id des hits (posé par buildHitDetailUrl,
  // qui l'encode — useParams renvoie le segment brut, encore encodé).
  const rawId = typeof routeParams?.id === "string" ? routeParams.id : null
  let currentUrlId: string | null = rawId
  try {
    currentUrlId = rawId === null ? null : decodeURIComponent(rawId)
  } catch {
    // segment non décodable : on compare la valeur brute
  }

  const { goPrev, goNext, position } = useMemo(() => {
    if (!isFromSearch || !from) return { position: null }
    const hits = result.data?.pages.flatMap((page) => page.hits) ?? []
    const currentIndex = currentUrlId ? hits.findIndex((hit) => hit.url_id === currentUrlId) : 0
    if (currentIndex === -1) return { position: null }
    const position = hits.length > 0 ? currentIndex + 1 : null
    if (hits.length <= 1) return { position }
    // Navigation circulaire sur la liste des résultats.
    const goToIndex = (index: number) => {
      const hit = hits[index]
      if (!hit) return undefined
      return () => router.push(buildHitDetailUrl({ sub_type: hit.sub_type ?? "", url_id: hit.url_id ?? "", title: hit.title ?? "" }, from))
    }
    return {
      goNext: goToIndex((currentIndex + 1) % hits.length),
      goPrev: goToIndex(currentIndex === 0 ? hits.length - 1 : currentIndex - 1),
      position,
    }
  }, [isFromSearch, from, result.data, currentUrlId, router])

  const swipeHandlers = useSwipeable({
    onSwiped: (eventData) => {
      if (eventData.dir === "Right") goPrev?.()
      else if (eventData.dir === "Left") goNext?.()
    },
  })

  return {
    swipeHandlers,
    goPrev,
    goNext,
    handleClose: isFromSearch && from ? () => router.push(from) : null,
    position,
  }
}
