import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import { Box, CircularProgress, Skeleton } from "@mui/material"
import { useEffect, useRef } from "react"
import type { useSearchResults } from "../_hooks/useSearchResults"
import type { ISearchPageParams } from "../_utils/search.params.utils"
import { SearchHitCard } from "./SearchHitCard"

type InfiniteResult = ReturnType<typeof useSearchResults>

interface SearchResultsListProps {
  result: InfiniteResult
  params: ISearchPageParams
}

export function SearchResultsList({ result, params }: SearchResultsListProps) {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = result

  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("3v"), mt: fr.spacing("4v") }}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant="rectangular" height={120} sx={{ borderRadius: "4px" }} />
        ))}
      </Box>
    )
  }

  if (isError) {
    return (
      <Box sx={{ mt: fr.spacing("4v") }}>
        <Alert severity="error" title="Erreur" description="Une erreur est survenue lors du chargement des résultats. Veuillez réessayer." />
      </Box>
    )
  }

  if (!data) return null

  const allHits = data.pages.flatMap((p) => p.hits)
  const nbHits = data.pages.at(-1)?.nbHits ?? 0

  if (allHits.length === 0) {
    return (
      <Box sx={{ mt: fr.spacing("4v"), textAlign: "center", color: fr.colors.decisions.text.mention.grey.default }}>
        <p>Aucun résultat pour votre recherche.</p>
      </Box>
    )
  }

  return (
    <Box sx={{ mt: fr.spacing("4v") }}>
      <Box
        sx={{
          mb: fr.spacing("3v"),
          color: fr.colors.decisions.text.mention.grey.default,
          fontSize: "0.875rem",
          fontWeight: 500,
        }}
      >
        {nbHits} résultat{nbHits > 1 ? "s" : ""}
      </Box>

      <Box>
        {allHits.map((hit) => (
          <SearchHitCard key={String(hit._id)} hit={hit} currentParams={params} />
        ))}
      </Box>

      {/* Sentinel pour l'infinite scroll */}
      <Box ref={sentinelRef} sx={{ height: 48, display: "flex", justifyContent: "center", alignItems: "center", mt: fr.spacing("4v") }}>
        {isFetchingNextPage && <CircularProgress size={24} />}
      </Box>
    </Box>
  )
}
