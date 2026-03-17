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

  const { data, isLoading, isError } = useSearchResults(params)
  const { navigate, navigateSilent } = useNavigateToSearchPage()

  function handleSearch(q: string) {
    navigate({ ...params, q: q || undefined, page: 0 })
  }

  function handleFilterChange(newParams: ISearchPageParams) {
    navigate(newParams)
  }

  function handlePageChange(newPage: number) {
    navigateSilent({ ...params, page: newPage })
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
            <SearchFilters params={params} facets={data?.facets} onNavigate={handleFilterChange} />
          </Box>

          <SearchActiveFilters params={params} onNavigate={handleFilterChange} />
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: fr.spacing("6v") }}>
        <SearchResultsList data={data} isLoading={isLoading} isError={isError} params={params} onPageChange={handlePageChange} />
      </Container>
    </Box>
  )
}
