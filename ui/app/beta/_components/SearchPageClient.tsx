"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons"
import { Box } from "@mui/material"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { Footer } from "@/app/_components/Footer"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { PublicHeader } from "@/app/_components/PublicHeader"
import { MATOMO_EVENTS, pushMatomoEvent, SEARCH_ENGINES } from "@/utils/matomoUtils"

import { useAutoRadius } from "../_hooks/useAutoRadius"
import { useSearchResults } from "../_hooks/useSearchResults"
import type { ISearchPageParams, SearchMode } from "../_utils/search.params.utils"
import { buildSearchUrl, parseSearchPageParams } from "../_utils/search.params.utils"
import type { FilterChange } from "../_utils/search.tracking.utils"
import { diffFilterChanges, searchTypeOf } from "../_utils/search.tracking.utils"
import { ExitNewSearchLink } from "./ExitNewSearchLink"
import { SearchBar } from "./SearchBar"
import { clearedFilters, SearchFilters } from "./SearchFilters"
import { SearchMobilePanel } from "./SearchMobilePanel"
import { SearchMobileSummaryBar } from "./SearchMobileSummaryBar"
import { SearchMobileTriModal } from "./SearchMobileTriModal"
import { SearchResultsList } from "./SearchResultsList"
import { SearchSortSelect } from "./SearchSortSelect"
import { SEARCH_MODE_OPTIONS, SearchTypeRechercheSelect } from "./SearchTypeRechercheSelect"

interface SearchPageClientProps {
  initialParams: ISearchPageParams
}

type MobilePanel = null | "search" | "filters" | "tri"

export function SearchPageClient({ initialParams }: SearchPageClientProps) {
  const rawSearchParams = useSearchParams()
  const params = rawSearchParams ? parseSearchPageParams(new URLSearchParams(rawSearchParams.toString())) : initialParams

  const result = useSearchResults(params)
  const router = useRouter()

  const [panel, setPanel] = useState<MobilePanel>(null)

  // Bandeau desktop collé ou non : sentinelle observée juste au-dessus du sticky — dès
  // qu'elle sort du viewport par le haut, le bandeau est collé (fond blanc pleine largeur).
  const [isStuck, setIsStuck] = useState(false)
  const stickySentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const sentinel = stickySentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(([entry]) => setIsStuck(!entry.isIntersecting))
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  const navigateSilent = useCallback(
    (newParams: ISearchPageParams) => {
      router.replace(buildSearchUrl(newParams, "/beta/recherche"))
    },
    [router]
  )

  const nbHits = result.data?.pages.at(-1)?.nbHits ?? 0
  const facets = result.data?.pages[0]?.facets
  const counts = result.data?.pages[0]?.counts

  // Changements de filtres en attente de leurs compteurs : la spec veut results_count et
  // active_filters_count APRÈS application — on mémorise le diff au clic et on pousse les
  // événements quand les résultats de la nouvelle recherche sont affichés (effet ci-dessous).
  const pendingFilterChangesRef = useRef<{ searchKey: string; changes: FilterChange[] } | null>(null)

  const searchKeyOf = (p: ISearchPageParams) => {
    const { page: _page, hitsPerPage: _hitsPerPage, q_source: _qSource, ...trackedParams } = p
    return JSON.stringify(trackedParams)
  }

  // search_results_displayed : une fois par recherche distincte (q/lieu/mode/filtres/tri),
  // pas à chaque page chargée via « Voir plus » — même événement que le legacy, enrichi de
  // search_engine. Les compteurs par type viennent de la facette `type` du result set.
  const lastTrackedSearchKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (!result.data) return
    // keepPreviousData : pendant le refetch, result.data appartient à la recherche PRÉCÉDENTE
    // → attendre les données fraîches (sinon compteurs faux sur les événements ci-dessous).
    if (result.isPlaceholderData) return
    const searchKey = searchKeyOf(params)

    // Flush des search_filter_applied/removed de la recherche affichée (compteurs post-application).
    if (pendingFilterChangesRef.current?.searchKey === searchKey) {
      const totalResults = result.data.pages.at(-1)?.nbHits ?? 0
      for (const change of pendingFilterChangesRef.current.changes) {
        pushMatomoEvent({
          event: change.action === "applied" ? MATOMO_EVENTS.SEARCH_FILTER_APPLIED : MATOMO_EVENTS.SEARCH_FILTER_REMOVED,
          filter_name: change.filter_name,
          filter_value: change.filter_value,
          active_filters_count: activeFilterCount,
          results_count: totalResults,
          search_engine: SEARCH_ENGINES.BETA,
        })
      }
      pendingFilterChangesRef.current = null
    }

    if (lastTrackedSearchKeyRef.current === searchKey) return
    lastTrackedSearchKeyRef.current = searchKey
    pushMatomoEvent({
      event: MATOMO_EVENTS.SEARCH_RESULTS_DISPLAYED,
      total_results: result.data.pages.at(-1)?.nbHits ?? 0,
      count_alternance: facets?.type?.offre ?? 0,
      count_formation: facets?.type?.formation ?? 0,
      search_job_name: params.q || "non_renseigné",
      search_address: params.lieu_label || "non_renseigné",
      search_diploma: params.level?.[0] ?? "indifferent",
      search_engine: SEARCH_ENGINES.BETA,
    })
  })
  // NB : effet sans tableau de deps (gardes idempotentes par searchKey) — il doit relire
  // activeFilterCount et le ref pending à chaque affichage de résultats.

  const activeFilterCount =
    (params.type_filter_label?.length ?? 0) +
    (params.contract_type?.length ?? 0) +
    (params.level?.length ?? 0) +
    (params.is_algo_company?.length ?? 0) +
    (params.start_date ? 1 : 0) +
    (params.handi ? 1 : 0) +
    (params.urgent ? 1 : 0) +
    (params.smart_apply ? 1 : 0)

  function handleSearch(q: string, source: "suggestion" | "free_text") {
    // Même événement que les formulaires legacy, enrichi de search_engine et de l'origine
    // de la saisie (suggestion d'autocomplétion vs texte libre).
    pushMatomoEvent({
      event: MATOMO_EVENTS.SEARCH_LAUNCHED,
      search_job_name: q || "non_renseigné",
      search_address: params.lieu_label || "non_renseigné",
      search_radius: params.radius,
      search_diploma: params.level?.[0] ?? "indifferent",
      search_origin: "page_resultat",
      search_engine: SEARCH_ENGINES.BETA,
      q_source: source,
    })
    navigateSilent({ ...params, q: q || undefined, q_source: q ? source : undefined, page: 0 })
  }

  function handleLieuChange(lieu: { label: string; latitude: number; longitude: number } | null) {
    // Nouveau lieu → on repart du rayon le plus étroit (élargissement auto ensuite).
    if (lieu) {
      navigateSilent({ ...params, lieu_label: lieu.label, latitude: lieu.latitude, longitude: lieu.longitude, radius: 20, page: 0 })
    } else {
      navigateSilent({ ...params, lieu_label: undefined, latitude: undefined, longitude: undefined, radius: 20, page: 0 })
    }
  }

  // Changement de type de recherche : les filtres actifs ne s'appliquent plus forcément au
  // nouveau mode (chips différentes) → remis à zéro, comme le tri s'il n'existe pas en mode
  // formations. Le clear implicite n'émet PAS de search_filter_removed (c'est un changement
  // de mode, pas des retraits unitaires — documenté sur Notion).
  function handleModeChange(mode: SearchMode) {
    pushMatomoEvent({ event: MATOMO_EVENTS.SEARCH_TYPE_CHANGED, search_type: searchTypeOf(mode), search_engine: SEARCH_ENGINES.BETA })
    const cleared = clearedFilters(params)
    const sortValidInMode = mode === "formations" ? params.sort === "proximity" : true
    navigateSilent({ ...cleared, mode, sort: sortValidInMode ? params.sort : undefined })
  }

  function handleRadiusChange(radius: number) {
    navigateSilent({ ...params, radius, page: 0 })
  }

  useAutoRadius({ params, result, onRadiusChange: handleRadiusChange })

  function handleFilterChange(newParams: ISearchPageParams) {
    // Mémorise le diff de filtres (un événement par valeur modifiée) — poussé avec les
    // compteurs post-application quand les résultats de la nouvelle recherche s'affichent.
    // Changements en rafale avant l'arrivée des résultats : les diffs s'accumulent.
    const changes = diffFilterChanges(params, newParams)
    if (changes.length) {
      pendingFilterChangesRef.current = {
        searchKey: searchKeyOf(newParams),
        changes: [...(pendingFilterChangesRef.current?.changes ?? []), ...changes],
      }
    }
    navigateSilent(newParams)
  }

  return (
    <>
      <Box component="main" sx={{ display: "flex", flexDirection: "column", backgroundColor: fr.colors.decisions.background.alt.grey.default, minHeight: "100dvh" }}>
        <PublicHeader />

        {/* Desktop : bandeau de recherche + liste mono-colonne (affichage piloté par CSS pour éviter le flash d'hydratation).
            overflow-x clip : le fond blanc 100vw du bandeau collé inclut la scrollbar — clip
            évite le débordement horizontal sans créer de scroll container (sticky préservé). */}
        <Box sx={{ display: { xs: "none", lg: "block" }, flex: 1, overflowX: "clip" }}>
          <DefaultContainer sx={{ py: fr.spacing("4v") }}>
            {/* Bandeau : champs + chips, panneau blanc arrondi comme le design — sticky au scroll.
                z-index > 500 : les cartes DSFR shadow portent z-index calc(--ground + 500) ;
                on reste sous les poppers des chips et les modales (1250-1300). */}
            <Box ref={stickySentinelRef} aria-hidden="true" sx={{ height: 0 }} />
            <Box sx={{ position: "sticky", top: 0, zIndex: 1000 }}>
              {/* Bandeau collé : fond blanc pleine largeur (comme le legacy) — couvre les
                  gouttières latérales du container et masque les résultats qui défilent
                  derrière (encoches des coins arrondis comprises). */}
              {isStuck && (
                <Box
                  aria-hidden="true"
                  sx={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: "50%",
                    width: "100vw",
                    transform: "translateX(-50%)",
                    backgroundColor: fr.colors.decisions.background.default.grey.default,
                  }}
                />
              )}
              <Box
                sx={{
                  position: "relative",
                  backgroundColor: fr.colors.decisions.background.default.grey.default,
                  borderRadius: "8px",
                  p: fr.spacing("6v"),
                  boxShadow: "0 2px 6px rgba(0,0,18,0.08)",
                }}
              >
                <Box sx={{ display: "flex", gap: fr.spacing("3v"), alignItems: "flex-end" }}>
                  <Box sx={{ flex: 1 }}>
                    <SearchBar initialQ={params.q} initialLieuLabel={params.lieu_label} onSubmit={handleSearch} onLieuChange={handleLieuChange} />
                  </Box>
                  <SearchTypeRechercheSelect value={params.mode} onChange={handleModeChange} />
                </Box>
                <Box sx={{ pt: fr.spacing("4v") }}>
                  <SearchFilters params={params} facets={facets} counts={counts} onNavigate={handleFilterChange} />
                </Box>
                <Box sx={{ display: "flex", justifyContent: "flex-end", pt: fr.spacing("3v") }}>
                  <ExitNewSearchLink />
                </Box>
              </Box>
            </Box>

            {/* Ligne tri + compteur */}
            <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", py: fr.spacing("4v") }}>
              <SearchSortSelect params={params} onNavigate={handleFilterChange} />
              <Box sx={{ fontWeight: 700, color: fr.colors.decisions.text.title.grey.default }}>
                {nbHits} résultat{nbHits > 1 ? "s" : ""}
              </Box>
            </Box>

            <SearchResultsList result={result} params={params} />
          </DefaultContainer>
        </Box>

        {/* Mobile : barre résumé (2 lignes + chips Filtres/Tri) et liste plein écran */}
        <Box sx={{ display: { xs: "flex", lg: "none" }, flexDirection: "column", flex: 1, minHeight: 0 }}>
          <Box
            sx={{
              position: "sticky",
              top: 0,
              // > 500 (cartes DSFR shadow), < 1250 (modales mobiles).
              zIndex: 1000,
              flexShrink: 0,
              px: fr.spacing("4v"),
              py: fr.spacing("2v"),
              backgroundColor: fr.colors.decisions.background.default.grey.default,
              borderBottom: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
            }}
          >
            <SearchMobileSummaryBar
              params={params}
              activeFilterCount={activeFilterCount}
              onOpenSearch={() => setPanel("search")}
              onOpenFilters={() => setPanel("filters")}
              onOpenTri={() => setPanel("tri")}
            />
          </Box>

          <Box sx={{ flex: 1, px: fr.spacing("4v"), py: fr.spacing("2v") }}>
            <SearchResultsList result={result} params={params} />
          </Box>
        </Box>

        {panel === "search" && (
          <SearchMobilePanel title="Modifier la recherche" onClose={() => setPanel(null)}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("4v") }}>
              <SearchBar layout="column" initialQ={params.q} initialLieuLabel={params.lieu_label} onSubmit={handleSearch} onLieuChange={handleLieuChange} />
              <RadioButtons
                legend="Type de recherche"
                options={SEARCH_MODE_OPTIONS.map((option) => ({
                  label: option.label,
                  hintText: option.hint,
                  nativeInputProps: { checked: params.mode === option.value, onChange: () => handleModeChange(option.value) },
                }))}
              />
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: fr.spacing("4v") }}>
                <Button priority="primary" iconId="fr-icon-search-line" onClick={() => setPanel(null)} style={{ width: "100%", justifyContent: "center" }}>
                  Rechercher
                </Button>
                <ExitNewSearchLink />
              </Box>
            </Box>
          </SearchMobilePanel>
        )}

        {panel === "tri" && <SearchMobileTriModal params={params} onNavigate={handleFilterChange} onClose={() => setPanel(null)} />}

        {panel === "filters" && (
          <SearchMobilePanel
            title="Filtrer les offres"
            onClose={() => setPanel(null)}
            footer={
              <Box sx={{ display: "flex", alignItems: "center", gap: fr.spacing("3v") }}>
                {activeFilterCount > 1 && (
                  <Button priority="tertiary no outline" onClick={() => handleFilterChange(clearedFilters(params))}>
                    Tout effacer
                  </Button>
                )}
                <Button priority="primary" onClick={() => setPanel(null)} style={{ flex: 1, justifyContent: "center" }}>
                  {nbHits > 1 ? `Voir les ${nbHits} résultats` : `Voir ${nbHits} résultat`}
                </Button>
              </Box>
            }
          >
            <SearchFilters variant="sections" params={params} facets={facets} counts={counts} onNavigate={handleFilterChange} />
          </SearchMobilePanel>
        )}
      </Box>
      <Footer />
    </>
  )
}
