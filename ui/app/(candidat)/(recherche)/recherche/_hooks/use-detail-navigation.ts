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
 * Valide le paramètre `?from=` d'une page de détail : seule une URL interne de la page de
 * résultats est acceptée. Tout le reste (absent, URL absolue externe, autre chemin interne)
 * est rejeté — `from` est réinjecté tel quel dans `router.push`, ce garde est ce qui empêche
 * une redirection arbitraire via un lien forgé.
 */
export function getSearchUrlFromParam(from: string | null): string | null {
  return from !== null && from.startsWith("/recherche") ? from : null
}

export type INavigationTargets = {
  position: number | null
  prevIndex: number | null
  nextIndex: number | null
}

/**
 * Calcule, dans la liste des résultats, la position de l'item courant et les index
 * précédent/suivant (navigation circulaire). Sans `currentUrlId` (conséquence historique
 * des liens partagés « recherche France entière »), la navigation démarre du premier
 * résultat mais `position` reste null : l'item affiché n'est pas identifié dans la liste.
 * Item absent de la liste → pas de navigation.
 */
export function computeNavigationTargets(hits: Array<{ url_id?: string | null }>, currentUrlId: string | null): INavigationTargets {
  const none: INavigationTargets = { position: null, prevIndex: null, nextIndex: null }
  const currentIndex = currentUrlId ? hits.findIndex((hit) => hit.url_id === currentUrlId) : 0
  if (currentIndex === -1 || hits.length === 0) return none
  const position = currentUrlId ? currentIndex + 1 : null
  if (hits.length <= 1) return { ...none, position }
  return {
    position,
    nextIndex: (currentIndex + 1) % hits.length,
    prevIndex: currentIndex === 0 ? hits.length - 1 : currentIndex - 1,
  }
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

  const from = getSearchUrlFromParam(searchParams?.get("from") ?? null)

  const fromSearchParams = useMemo(() => new URLSearchParams(from !== null ? (from.split("?")[1] ?? "") : ""), [from])
  const params = useMemo(() => parseSearchPageParams(fromSearchParams), [fromSearchParams])

  const result = useSearchResults(params, { enabled: from !== null })

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
    if (from === null) return { position: null }
    const hits = result.data?.pages.flatMap((page) => page.hits) ?? []
    const targets = computeNavigationTargets(hits, currentUrlId)
    const goToIndex = (index: number | null) => {
      const hit = index === null ? undefined : hits[index]
      if (!hit) return undefined
      return () => router.push(buildHitDetailUrl({ sub_type: hit.sub_type ?? "", url_id: hit.url_id ?? "", title: hit.title ?? "" }, from))
    }
    return {
      goNext: goToIndex(targets.nextIndex),
      goPrev: goToIndex(targets.prevIndex),
      position: targets.position,
    }
  }, [from, result.data, currentUrlId, router])

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
    handleClose: from !== null ? () => router.push(from) : null,
    position,
  }
}
