"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Container } from "@mui/material"
import { useSearchParams } from "next/navigation"
import { useNavigateToSearchPage } from "../_hooks/useNavigateToSearchPage"
import { useSearchResults } from "../_hooks/useSearchResults"
import type { ISearchPageParams } from "../_utils/search.params.utils"
import { parseSearchPageParams } from "../_utils/search.params.utils"
import { SearchActiveFilters } from "./SearchActiveFilters"
import { SearchBar } from "./SearchBar"
import { SearchFilters } from "./SearchFilters"
import { SearchResultsList } from "./SearchResultsList"

interface SearchPageClientProps {
  initialParams: ISearchPageParams
}

export function SearchPageClient({ initialParams }: SearchPageClientProps) {
  const rawSearchParams = useSearchParams()
  const params = rawSearchParams ? parseSearchPageParams(new URLSearchParams(rawSearchParams.toString())) : initialParams

  const result = useSearchResults(params)
  const { navigate } = useNavigateToSearchPage()

  function handleSearch(q: string) {
    navigate({ ...params, q: q || undefined, page: 0 })
  }

  function handleFilterChange(newParams: ISearchPageParams) {
    navigate(newParams)
  }

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        backgroundColor: fr.colors.decisions.background.alt.grey.default,
      }}
    >
      <Box
        sx={{
          backgroundColor: fr.colors.decisions.background.alt.grey.default,
          py: fr.spacing("6v"),
          borderBottom: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
        }}
      >
        <Container maxWidth="lg">
          <SearchBar initialQ={params.q} onSubmit={handleSearch} />

          <Box sx={{ mt: fr.spacing("3v") }}>
            <SearchFilters params={params} facets={result.data?.pages[0]?.facets} onNavigate={handleFilterChange} />
          </Box>

          <SearchActiveFilters params={params} facets={result.data?.pages[0]?.facets} onNavigate={handleFilterChange} />
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: fr.spacing("6v") }}>
        <SearchResultsList result={result} params={params} />
      </Container>
    </Box>
  )
}
