import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, CircularProgress, Skeleton } from "@mui/material"
import type { useSearchResults } from "../_hooks/useSearchResults"
import type { ISearchPageParams } from "../_utils/search.params.utils"
import type { Hit } from "./SearchHitCard"
import { SearchHitCard } from "./SearchHitCard"

type InfiniteResult = ReturnType<typeof useSearchResults>

interface SearchResultsListProps {
  result: InfiniteResult
  params: ISearchPageParams
  selectedHitId?: string
  onHitSelect?: (hit: Hit) => void
}

export function SearchResultsList({ result, params, selectedHitId, onHitSelect }: SearchResultsListProps) {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = result

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

  if (allHits.length === 0) {
    return (
      <Box sx={{ mt: fr.spacing("4v"), textAlign: "center", color: fr.colors.decisions.text.mention.grey.default }}>
        <p>Aucun résultat pour votre recherche.</p>
      </Box>
    )
  }

  return (
    <Box>
      <Box>
        {allHits.map((hit) => (
          <SearchHitCard key={String(hit._id)} hit={hit} currentParams={params} isSelected={selectedHitId !== undefined && hit.url_id === selectedHitId} onSelect={onHitSelect} />
        ))}
      </Box>

      {/* RGAA : chargement à la demande (CTA), pas de scroll infini — le chargement doit
          rester déclenchable au clavier et ne pas se produire sans action de l'utilisateur. */}
      {hasNextPage && (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: fr.spacing("4v") }}>
          {isFetchingNextPage ? (
            <CircularProgress size={24} />
          ) : (
            <Button priority="secondary" onClick={() => fetchNextPage()}>
              Voir plus de résultats
            </Button>
          )}
        </Box>
      )}
    </Box>
  )
}
