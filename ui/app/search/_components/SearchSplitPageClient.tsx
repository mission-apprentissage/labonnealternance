"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, useMediaQuery, useTheme } from "@mui/material"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { useSearchResults } from "../_hooks/useSearchResults"
import type { ISearchPageParams } from "../_utils/search.params.utils"
import { buildSearchUrl, parseSearchPageParams } from "../_utils/search.params.utils"
import { SearchActiveFilters } from "./SearchActiveFilters"
import { SearchBar } from "./SearchBar"
import { SearchDetailPanel } from "./SearchDetailPanel"
import { SearchFilters } from "./SearchFilters"
import type { Hit } from "./SearchHitCard"
import { SearchResultsList } from "./SearchResultsList"

interface SearchSplitPageClientProps {
  initialParams: ISearchPageParams
}

export function SearchSplitPageClient({ initialParams }: SearchSplitPageClientProps) {
  const rawSearchParams = useSearchParams()
  const params = rawSearchParams ? parseSearchPageParams(new URLSearchParams(rawSearchParams.toString())) : initialParams

  const result = useSearchResults(params)
  const router = useRouter()
  const theme = useTheme()

  const navigateSilent = useCallback(
    (newParams: ISearchPageParams) => {
      router.replace(buildSearchUrl(newParams, "/search/split"))
    },
    [router]
  )
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"))

  const allHits = result.data?.pages.flatMap((p) => p.hits) ?? []
  const selectedHit: Hit | null = params.selected ? (allHits.find((h) => h.url_id === params.selected) ?? null) : null

  function handleSearch(q: string) {
    navigateSilent({ ...params, q: q || undefined, page: 0, selected: undefined })
  }

  function handleLieuChange(lieu: { label: string; latitude: number; longitude: number } | null) {
    if (lieu) {
      navigateSilent({ ...params, lieu_label: lieu.label, latitude: lieu.latitude, longitude: lieu.longitude, page: 0, selected: undefined })
    } else {
      navigateSilent({ ...params, lieu_label: undefined, latitude: undefined, longitude: undefined, page: 0, selected: undefined })
    }
  }

  function handleFilterChange(newParams: ISearchPageParams) {
    navigateSilent({ ...newParams, selected: undefined })
  }

  function handleHitSelect(hit: Hit) {
    navigateSilent({ ...params, selected: hit.url_id ?? undefined })
  }

  return (
    <Box
      component="main"
      sx={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#F8FAFC",
        overflow: "hidden",
      }}
    >
      {/* Header sticky */}
      <Box
        sx={{
          flexShrink: 0,
          backgroundColor: fr.colors.decisions.background.alt.grey.default,
          py: fr.spacing("4v"),
          borderBottom: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
          px: { xs: fr.spacing("4v"), md: fr.spacing("6v") },
        }}
      >
        <SearchBar initialQ={params.q} initialLieuLabel={params.lieu_label} onSubmit={handleSearch} onLieuChange={handleLieuChange} />
        <Box sx={{ mt: fr.spacing("3v") }}>
          <SearchFilters params={params} facets={result.data?.pages[0]?.facets} onNavigate={handleFilterChange} />
        </Box>
        <SearchActiveFilters params={params} onNavigate={handleFilterChange} />
      </Box>

      {/* Body */}
      {isDesktop ? (
        // Desktop : split layout
        <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Colonne gauche */}
          <Box
            sx={{
              width: 560,
              flexShrink: 0,
              overflowY: "auto",
              borderRight: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
              px: fr.spacing("4v"),
            }}
          >
            <SearchResultsList result={result} params={params} selectedHitId={params.selected} onHitSelect={handleHitSelect} />
          </Box>

          {/* Colonne droite */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              transition: "opacity 150ms ease",
            }}
          >
            <SearchDetailPanel hit={selectedHit} currentParams={params} />
          </Box>
        </Box>
      ) : (
        // Mobile : layout colonne classique (cards naviguent vers la page détail)
        <Box sx={{ flex: 1, overflowY: "auto", px: fr.spacing("4v") }}>
          <SearchResultsList result={result} params={params} />
        </Box>
      )}
    </Box>
  )
}
