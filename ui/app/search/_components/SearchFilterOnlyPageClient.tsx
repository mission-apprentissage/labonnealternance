"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, TextField } from "@mui/material"
import Autocomplete from "@mui/material/Autocomplete"
import { useQuery } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { Footer } from "@/app/_components/Footer"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { PublicHeader } from "@/app/_components/PublicHeader"
import { searchAddress } from "@/services/baseAdresse"

import { useAutoRadius } from "../_hooks/useAutoRadius"
import { useSearchResults } from "../_hooks/useSearchResults"
import type { ISearchPageParams } from "../_utils/search.params.utils"
import { buildSearchUrl, parseSearchPageParams } from "../_utils/search.params.utils"
import { SearchDetailPanel } from "./SearchDetailPanel"
import { SearchFilterBar } from "./SearchFilterBar"
import { SearchFilters } from "./SearchFilters"
import type { Hit } from "./SearchHitCard"
import { SearchMobilePanel } from "./SearchMobilePanel"
import { SearchResultsList } from "./SearchResultsList"

interface SearchFilterOnlyPageClientProps {
  initialParams: ISearchPageParams
}

type MobilePanel = null | "search" | "filters"

type LieuOption = { label: string; latitude: number; longitude: number }

/** Champ Lieu pour le panneau mobile « Modifier la recherche » (dupliqué de la barre, vue de test). */
function MobileSearchFields({ params, onNavigate }: { params: ISearchPageParams; onNavigate: (p: ISearchPageParams) => void }) {
  const [lieuInput, setLieuInput] = useState(params.lieu_label ?? "")
  const [lieuValue, setLieuValue] = useState<LieuOption | null>(null)
  const [debounced, setDebounced] = useState(lieuInput)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(lieuInput), 300)
    return () => clearTimeout(t)
  }, [lieuInput])

  const { data } = useQuery({
    queryKey: ["lieu-suggestions", debounced],
    queryFn: () => searchAddress(debounced),
    enabled: debounced.length >= 2,
    staleTime: 1000 * 60 * 5,
    throwOnError: false,
  })
  const suggestions: LieuOption[] = (data ?? []).map((item) => ({ label: item.label, latitude: item.value.coordinates[1], longitude: item.value.coordinates[0] }))

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("4v") }}>
      <Box>
        <Box
          component="label"
          htmlFor="m-lieu"
          sx={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: fr.colors.decisions.text.mention.grey.default, mb: fr.spacing("1v") }}
        >
          Où cherchez-vous une alternance ?
        </Box>
        <Autocomplete
          freeSolo
          fullWidth
          options={suggestions}
          getOptionLabel={(o) => (typeof o === "string" ? o : o.label)}
          isOptionEqualToValue={(o, v) => (typeof v === "string" ? o.label === v : o.label === v.label)}
          inputValue={lieuInput}
          value={lieuValue}
          onInputChange={(_e, value, reason) => {
            setLieuInput(value)
            if (reason === "clear") {
              setLieuValue(null)
              onNavigate({ ...params, lieu_label: undefined, latitude: undefined, longitude: undefined, page: 0 })
            }
          }}
          onChange={(_e, value) => {
            if (value && typeof value !== "string") {
              setLieuValue(value)
              // Nouveau lieu → rayon repart à 20 (élargissement auto ensuite).
              onNavigate({ ...params, lieu_label: value.label, latitude: value.latitude, longitude: value.longitude, radius: 20, page: 0 })
            }
          }}
          renderInput={(p) => <TextField {...p} id="m-lieu" placeholder="Adresse, ville ou code postal" size="small" fullWidth />}
          noOptionsText="Aucune suggestion"
          filterOptions={(x) => x}
        />
      </Box>
    </Box>
  )
}

export function SearchFilterOnlyPageClient({ initialParams }: SearchFilterOnlyPageClientProps) {
  const rawSearchParams = useSearchParams()
  const params = rawSearchParams ? parseSearchPageParams(new URLSearchParams(rawSearchParams.toString())) : initialParams

  const result = useSearchResults(params)
  const router = useRouter()

  const [panel, setPanel] = useState<MobilePanel>(null)

  const navigateSilent = useCallback(
    (newParams: ISearchPageParams) => {
      router.replace(buildSearchUrl(newParams, "/search/filter-only"))
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

  function handleFilterChange(newParams: ISearchPageParams) {
    navigateSilent({ ...newParams, selected: undefined })
  }

  useAutoRadius({ params, result, onRadiusChange: (radius) => navigateSilent({ ...params, radius, page: 0, selected: undefined }) })

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
          height: { lg: "100dvh" },
          overflow: { lg: "hidden" },
        }}
      >
        <Box sx={{ flexShrink: 0 }}>
          <PublicHeader />
        </Box>

        {/* Desktop : barre une ligne + split (affichage CSS, pas de useMediaQuery) */}
        <Box sx={{ display: { xs: "none", lg: "flex" }, flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
          <Box
            sx={{
              flexShrink: 0,
              backgroundColor: fr.colors.decisions.background.default.grey.default,
              borderBottom: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
            }}
          >
            <DefaultContainer sx={{ py: fr.spacing("4v") }}>
              <SearchFilterBar params={params} facets={result.data?.pages[0]?.facets} onNavigate={handleFilterChange} />
            </DefaultContainer>
          </Box>

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
              <SearchResultsList result={result} params={params} selectedHitId={params.selected} onHitSelect={handleHitSelect} />
            </Box>

            <Box sx={{ flex: 1, overflowY: "auto", px: fr.spacing("8v"), py: fr.spacing("4v") }}>
              <SearchDetailPanel hit={selectedHit} currentParams={params} />
            </Box>
          </DefaultContainer>
        </Box>

        {/* Mobile : liste plein écran + 2 boutons (affichage CSS) */}
        <Box sx={{ display: { xs: "flex", lg: "none" }, flexDirection: "column", flex: 1, minHeight: 0 }}>
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

          <Box sx={{ flex: 1, px: fr.spacing("4v"), py: fr.spacing("2v") }}>
            <SearchResultsList result={result} params={params} />
          </Box>
        </Box>

        {panel === "search" && (
          <SearchMobilePanel
            title="Modifier la recherche"
            onClose={() => setPanel(null)}
            footer={
              <Button priority="primary" iconId="fr-icon-search-line" onClick={() => setPanel(null)} style={{ width: "100%", justifyContent: "center" }}>
                Rechercher
              </Button>
            }
          >
            <MobileSearchFields params={params} onNavigate={handleFilterChange} />
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
