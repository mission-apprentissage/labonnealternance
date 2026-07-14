"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"

import { Footer } from "@/app/_components/Footer"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { PublicHeader } from "@/app/_components/PublicHeader"

import { useAutoRadius } from "../_hooks/useAutoRadius"
import { useSearchResults } from "../_hooks/useSearchResults"
import type { ISearchPageParams } from "../_utils/search.params.utils"
import { buildSearchUrl, parseSearchPageParams } from "../_utils/search.params.utils"
import { SearchActiveFilters } from "./SearchActiveFilters"
import { SearchBar } from "./SearchBar"
import { SearchDetailPanel } from "./SearchDetailPanel"
import { SearchFilters } from "./SearchFilters"
import type { Hit } from "./SearchHitCard"
import { SearchMobilePanel } from "./SearchMobilePanel"
import { SearchResultsList } from "./SearchResultsList"
import { SearchSortSelect } from "./SearchSortSelect"

interface SearchSplitPageClientProps {
  initialParams: ISearchPageParams
}

type MobilePanel = null | "search" | "filters"

export function SearchSplitPageClient({ initialParams }: SearchSplitPageClientProps) {
  const rawSearchParams = useSearchParams()
  const params = rawSearchParams ? parseSearchPageParams(new URLSearchParams(rawSearchParams.toString())) : initialParams

  const result = useSearchResults(params)
  const router = useRouter()

  const [panel, setPanel] = useState<MobilePanel>(null)

  const navigateSilent = useCallback(
    (newParams: ISearchPageParams) => {
      router.replace(buildSearchUrl(newParams, "/search/split"))
    },
    [router]
  )

  const allHits = result.data?.pages.flatMap((p) => p.hits) ?? []
  const nbHits = result.data?.pages.at(-1)?.nbHits ?? 0
  const selectedHit: Hit | null = params.selected ? (allHits.find((h) => h.url_id === params.selected) ?? null) : null

  const activeFilterCount =
    (params.type_filter_label?.length ?? 0) +
    (params.contract_type?.length ?? 0) +
    (params.level?.length ?? 0) +
    (params.activity_sector?.length ?? 0) +
    (params.organization_name ? 1 : 0)

  function handleSearch(q: string, source: "suggestion" | "free_text") {
    navigateSilent({ ...params, q: q || undefined, q_source: q ? source : undefined, page: 0, selected: undefined })
  }

  function handleLieuChange(lieu: { label: string; latitude: number; longitude: number } | null) {
    // Nouveau lieu → on repart du rayon le plus étroit (élargissement auto ensuite).
    if (lieu) {
      navigateSilent({ ...params, lieu_label: lieu.label, latitude: lieu.latitude, longitude: lieu.longitude, radius: 20, page: 0, selected: undefined })
    } else {
      navigateSilent({ ...params, lieu_label: undefined, latitude: undefined, longitude: undefined, radius: 20, page: 0, selected: undefined })
    }
  }

  function handleRadiusChange(radius: number) {
    navigateSilent({ ...params, radius, page: 0, selected: undefined })
  }

  useAutoRadius({ params, result, onRadiusChange: handleRadiusChange })

  function handleFilterChange(newParams: ISearchPageParams) {
    navigateSilent({ ...newParams, selected: undefined })
  }

  function handleHitSelect(hit: Hit) {
    navigateSilent({ ...params, selected: hit.url_id ?? undefined })
  }

  function clearAllFilters() {
    navigateSilent({
      ...params,
      type_filter_label: undefined,
      contract_type: undefined,
      level: undefined,
      activity_sector: undefined,
      organization_name: undefined,
      page: 0,
      selected: undefined,
    })
  }

  return (
    <>
      <Box
        component="main"
        sx={{
          display: "flex",
          flexDirection: "column",
          backgroundColor: fr.colors.decisions.background.alt.grey.default,
          minHeight: "100dvh",
          // Desktop : hauteur fixe pour le scroll interne du split (footer révélé en scrollant la page). Mobile : flux naturel.
          height: { lg: "100dvh" },
          overflow: { lg: "hidden" },
        }}
      >
        <Box sx={{ flexShrink: 0 }}>
          <PublicHeader />
        </Box>

        {/* Desktop : vue scindée (affichage piloté par CSS pour éviter le flash d'hydratation) */}
        <Box sx={{ display: { xs: "none", lg: "flex" }, flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
          {/* Barre recherche + filtres */}
          <Box
            sx={{
              flexShrink: 0,
              backgroundColor: fr.colors.decisions.background.default.grey.default,
              borderBottom: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
            }}
          >
            {/* Barre exclue de la largeur dynamique : conteneur fixe (xl) comme le legacy. */}
            <DefaultContainer sx={{ py: fr.spacing("4v") }}>
              <SearchBar initialQ={params.q} initialLieuLabel={params.lieu_label} onSubmit={handleSearch} onLieuChange={handleLieuChange} />
              <Box sx={{ pt: fr.spacing("4v") }}>
                <SearchFilters params={params} facets={result.data?.pages[0]?.facets} onNavigate={handleFilterChange} />
              </Box>
              <SearchActiveFilters params={params} onNavigate={handleFilterChange} />
            </DefaultContainer>
          </Box>

          {/* Split */}
          <DefaultContainer sx={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
            <Box
              sx={{
                flex: "0 0 480px",
                overflowY: "auto",
                borderRight: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
                pr: fr.spacing("5v"),
                py: fr.spacing("4v"),
              }}
            >
              <Box sx={{ mb: fr.spacing("3v") }}>
                <SearchSortSelect params={params} onNavigate={handleFilterChange} />
              </Box>
              <SearchResultsList result={result} params={params} selectedHitId={params.selected} onHitSelect={handleHitSelect} />
            </Box>

            <Box sx={{ flex: 1, overflowY: "auto", px: fr.spacing("8v"), py: fr.spacing("4v") }}>
              <SearchDetailPanel hit={selectedHit} currentParams={params} />
            </Box>
          </DefaultContainer>
        </Box>

        {/* Mobile : liste plein écran + 2 boutons (affichage piloté par CSS) */}
        <Box sx={{ display: { xs: "flex", lg: "none" }, flexDirection: "column", flex: 1, minHeight: 0 }}>
          {/* Barre d'actions mobile */}
          <Box
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 30,
              flexShrink: 0,
              display: "flex",
              gap: fr.spacing("2v"),
              px: fr.spacing("4v"),
              py: fr.spacing("2v"),
              backgroundColor: fr.colors.decisions.background.default.grey.default,
              borderBottom: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
            }}
          >
            <Button priority="secondary" iconId="fr-icon-search-line" onClick={() => setPanel("search")} style={{ flex: 1, justifyContent: "center" }}>
              Modifier la recherche
            </Button>
            <Button priority="secondary" iconId="fr-icon-filter-line" onClick={() => setPanel("filters")} style={{ flex: 1, justifyContent: "center" }}>
              Filtrer{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </Button>
          </Box>

          {/* Liste plein écran */}
          <Box sx={{ flex: 1, px: fr.spacing("4v"), py: fr.spacing("2v") }}>
            <Box sx={{ mb: fr.spacing("3v") }}>
              <SearchSortSelect params={params} onNavigate={handleFilterChange} />
            </Box>
            <SearchResultsList result={result} params={params} />
          </Box>
        </Box>

        {panel === "search" && (
          <SearchMobilePanel title="Modifier la recherche" onClose={() => setPanel(null)}>
            <SearchBar layout="column" initialQ={params.q} initialLieuLabel={params.lieu_label} onSubmit={handleSearch} onLieuChange={handleLieuChange} />
          </SearchMobilePanel>
        )}

        {panel === "filters" && (
          <SearchMobilePanel
            title="Filtrer les offres"
            onClose={() => setPanel(null)}
            footer={
              <Box sx={{ display: "flex", alignItems: "center", gap: fr.spacing("3v") }}>
                {activeFilterCount > 1 && (
                  <Button priority="tertiary no outline" onClick={clearAllFilters}>
                    Tout effacer
                  </Button>
                )}
                <Button priority="primary" onClick={() => setPanel(null)} style={{ flex: 1, justifyContent: "center" }}>
                  Voir les {nbHits} résultats
                </Button>
              </Box>
            }
          >
            <SearchFilters variant="sections" params={params} facets={result.data?.pages[0]?.facets} onNavigate={handleFilterChange} />
          </SearchMobilePanel>
        )}
      </Box>
      <Footer />
    </>
  )
}
