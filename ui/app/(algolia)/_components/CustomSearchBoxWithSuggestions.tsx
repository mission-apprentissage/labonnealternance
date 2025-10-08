import { fr } from "@codegouvfr/react-dsfr"
import { Box, FormControl, FormLabel, Typography } from "@mui/material"
import { algoliasearch } from "algoliasearch"
import React from "react"
import { useSearchBox } from "react-instantsearch"

import AlgoliaAutocompleteAsync from "@/app/(algolia)/_components/AlgoliaAutocomplete"
import { publicConfig } from "@/config.public"

const { algoliaApiKey, algoliaAppId } = publicConfig

const searchClient = algoliasearch(algoliaAppId, algoliaApiKey)

interface QuerySuggestion {
  objectID: string
  query: string
  popularity?: number
  exact_nb_hits?: number
}

export function CustomSearchBoxWithSuggestions(props: any) {
  const { query, refine } = useSearchBox(props)

  const handleAlgoliaSearch = async (searchQuery: string): Promise<QuerySuggestion[]> => {
    if (!searchQuery.trim()) return []

    try {
      const response = await searchClient.searchSingleIndex({
        indexName: "lba_query_suggestions",
        searchParams: {
          query: searchQuery,
          hitsPerPage: 8,
          attributesToRetrieve: ["query", "popularity", "exact_nb_hits"],
        },
      })

      return response.hits as QuerySuggestion[]
    } catch (error: any) {
      throw new Error(`Search failed: ${error.message}`)
    }
  }

  const handleSuggestionSelect = (item: QuerySuggestion | null) => {
    if (item) {
      refine(item.query)
    }
  }

  const handleInputChange = (inputValue: string, hasError: boolean) => {
    if (!hasError) {
      refine(inputValue)
    }
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: fr.spacing("3w"), width: "100%" }}>
      <FormControl fullWidth>
        <FormLabel>Métier ou formation</FormLabel>
        <AlgoliaAutocompleteAsync<QuerySuggestion>
          name="search-suggestions"
          placeholder="Indiquer un métier ou une formation"
          handleSearch={handleAlgoliaSearch}
          onSelectItem={handleSuggestionSelect}
          initInputValue={query}
          itemToString={(item) => item?.query || ""}
          renderItem={(item, highlighted) => (
            <Box
              sx={{
                padding: "8px 16px",
                backgroundColor: highlighted ? "#e3f2fd" : "transparent",
                cursor: "pointer",
                borderRadius: "4px",
                margin: "2px 0",
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: highlighted ? 600 : 400,
                  color: "#333",
                }}
              >
                {item.query}
              </Typography>
              {item.exact_nb_hits && (
                <Typography
                  sx={{
                    fontSize: "12px",
                    color: "#666",
                    marginTop: "2px",
                  }}
                >
                  {item.exact_nb_hits} résultat{item.exact_nb_hits > 1 ? "s" : ""}
                </Typography>
              )}
            </Box>
          )}
          onInputFieldChange={handleInputChange}
          onError={(error, inputValue) => {
            console.error("Query suggestions search error:", error)
            // Still allow manual search even if suggestions fail
            refine(inputValue)
          }}
          renderError={() => null} // Silently handle errors, still allow typing
          renderNoResult={<Typography sx={{ padding: "8px 16px", fontSize: "12px", color: "#666" }}>Aucune suggestion trouvée</Typography>}
          allowHealFromError={true}
          debounceDelayInMs={300}
          dataTestId="search-suggestions"
        />
      </FormControl>
    </Box>
  )
}
