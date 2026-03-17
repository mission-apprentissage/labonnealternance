import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import { Box, Skeleton } from "@mui/material"
import type { useSearchResults } from "../_hooks/useSearchResults"
import type { ISearchPageParams } from "../_utils/search.params.utils"
import { SearchHitCard } from "./SearchHitCard"

type SearchData = NonNullable<ReturnType<typeof useSearchResults>["data"]>

interface SearchResultsListProps {
  data: SearchData | undefined
  isLoading: boolean
  isError: boolean
  params: ISearchPageParams
  onPageChange: (page: number) => void
}

export function SearchResultsList({ data, isLoading, isError, params, onPageChange }: SearchResultsListProps) {
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

  const { hits, nbHits, nbPages, page } = data

  if (hits.length === 0) {
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
        {hits.map((hit) => (
          <SearchHitCard key={String(hit._id)} hit={hit} currentParams={params} />
        ))}
      </Box>

      {nbPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: fr.spacing("6v") }}>
          <nav role="navigation" aria-label="Pagination">
            <ul className={fr.cx("fr-pagination__list")}>
              <li>
                <button
                  className={fr.cx("fr-pagination__link", "fr-pagination__link--prev")}
                  onClick={() => onPageChange(page - 1)}
                  disabled={page === 0}
                  aria-label="Page précédente"
                >
                  Précédent
                </button>
              </li>
              {Array.from({ length: nbPages }, (_, i) => (
                <li key={i}>
                  <button
                    className={fr.cx("fr-pagination__link")}
                    onClick={() => onPageChange(i)}
                    aria-current={i === page ? "page" : undefined}
                    style={{
                      fontWeight: i === page ? 700 : undefined,
                      color: i === page ? fr.colors.decisions.text.actionHigh.blueFrance.default : undefined,
                    }}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}
              <li>
                <button
                  className={fr.cx("fr-pagination__link", "fr-pagination__link--next")}
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= nbPages - 1}
                  aria-label="Page suivante"
                >
                  Suivant
                </button>
              </li>
            </ul>
          </nav>
        </Box>
      )}
    </Box>
  )
}
