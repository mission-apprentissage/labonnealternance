"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons"
import { Box } from "@mui/material"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import { Footer } from "@/app/_components/Footer"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { PublicHeader } from "@/app/_components/PublicHeader"

import { useAutoRadius } from "../_hooks/useAutoRadius"
import { useSearchResults } from "../_hooks/useSearchResults"
import type { ISearchPageParams, SearchMode } from "../_utils/search.params.utils"
import { buildSearchUrl, parseSearchPageParams } from "../_utils/search.params.utils"
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

  const navigateSilent = useCallback(
    (newParams: ISearchPageParams) => {
      router.replace(buildSearchUrl(newParams, "/beta/recherche"))
    },
    [router]
  )

  const nbHits = result.data?.pages.at(-1)?.nbHits ?? 0
  const facets = result.data?.pages[0]?.facets
  const handiCount = result.data?.pages[0]?.counts?.is_disabled_elligible

  const activeFilterCount =
    (params.type_filter_label?.length ?? 0) +
    (params.contract_type?.length ?? 0) +
    (params.level?.length ?? 0) +
    (params.is_algo_company !== undefined ? 1 : 0) +
    (params.start_date ? 1 : 0) +
    (params.handi ? 1 : 0) +
    (params.urgent ? 1 : 0) +
    (params.smart_apply ? 1 : 0)

  function handleSearch(q: string, source: "suggestion" | "free_text") {
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
  // formations.
  function handleModeChange(mode: SearchMode) {
    const cleared = clearedFilters(params)
    const sortValidInMode = mode === "formations" ? params.sort === "proximity" : true
    navigateSilent({ ...cleared, mode, sort: sortValidInMode ? params.sort : undefined })
  }

  function handleRadiusChange(radius: number) {
    navigateSilent({ ...params, radius, page: 0 })
  }

  useAutoRadius({ params, result, onRadiusChange: handleRadiusChange })

  function handleFilterChange(newParams: ISearchPageParams) {
    navigateSilent(newParams)
  }

  return (
    <>
      <Box component="main" sx={{ display: "flex", flexDirection: "column", backgroundColor: fr.colors.decisions.background.alt.grey.default, minHeight: "100dvh" }}>
        <PublicHeader />

        {/* Desktop : bandeau de recherche + liste mono-colonne (affichage piloté par CSS pour éviter le flash d'hydratation) */}
        <Box sx={{ display: { xs: "none", lg: "block" }, flex: 1 }}>
          <DefaultContainer sx={{ py: fr.spacing("4v") }}>
            {/* Bandeau : champs + chips, panneau blanc arrondi comme le design */}
            <Box
              sx={{
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
              <Box sx={{ display: "flex", alignItems: "flex-end", gap: fr.spacing("3v"), pt: fr.spacing("4v") }}>
                <Box sx={{ flex: 1 }}>
                  <SearchFilters params={params} facets={facets} handiCount={handiCount} onNavigate={handleFilterChange} />
                </Box>
                <ExitNewSearchLink />
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
              zIndex: 30,
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
                <Button priority="primary" iconId="fr-icon-search-line" onClick={() => setPanel(null)}>
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
                  Voir les {nbHits} résultats
                </Button>
              </Box>
            }
          >
            <SearchFilters variant="sections" params={params} facets={facets} handiCount={handiCount} onNavigate={handleFilterChange} />
          </SearchMobilePanel>
        )}
      </Box>
      <Footer />
    </>
  )
}
