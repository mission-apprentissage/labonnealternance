import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, CircularProgress, Skeleton } from "@mui/material"
import Image from "next/image"
import { useLayoutEffect, useRef } from "react"
import { RADIUS_MAX } from "../_hooks/use-auto-radius"
import type { useSearchResults } from "../_hooks/use-search-results"
import type { ISearchPageParams } from "../_utils/search.params.utils"
import { SearchHitCard } from "./SearchHitCard"

type InfiniteResult = ReturnType<typeof useSearchResults>

interface SearchResultsListProps {
  result: InfiniteResult
  params: ISearchPageParams
  /**
   * url_id de la carte à ramener en vue au premier rendu où elle est disponible (retour
   * depuis une fiche détail fermée — cf. useDetailNavigation/withActiveHit). Undefined/null
   * en usage normal.
   */
  scrollToHitId?: string | null
}

function LoadingSkeletons() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("3v"), mt: fr.spacing("4v") }}>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} variant="rectangular" height={120} sx={{ borderRadius: "4px" }} />
      ))}
    </Box>
  )
}

export function SearchResultsList({ result, params, scrollToHitId }: SearchResultsListProps) {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = result

  const cardRefs = useRef(new Map<string, HTMLElement>())
  const hasScrolledRef = useRef(false)

  // Retour depuis une fiche détail : re-scroller sur la carte consultée plutôt que de revenir
  // en haut de liste. useLayoutEffect (avant la peinture du navigateur) + behavior "instant" :
  // aucune animation à traversée de liste ni flash du haut — la toute première image peinte
  // après le montage est déjà à la bonne position, même avec beaucoup de résultats chargés
  // (« Voir plus »). Pas de tableau de deps : l'effet est ré-essayé à chaque rendu jusqu'à ce
  // que la carte existe (chargement asynchrone des résultats) ; hasScrolledRef le rend inerte
  // une fois la carte trouvée, ou si elle n'est jamais chargée (repli silencieux, cf. hook).
  useLayoutEffect(() => {
    if (!scrollToHitId || hasScrolledRef.current) return
    const card = cardRefs.current.get(scrollToHitId)
    if (!card) return
    hasScrolledRef.current = true
    card.scrollIntoView({ block: "center", behavior: "instant" })
  })

  if (isLoading) return <LoadingSkeletons />

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
    // L'élargissement automatique du rayon (useAutoRadius) est encore en cours : l'état vide
    // ne s'affiche qu'une fois tous les paliers épuisés (100 km).
    const stillWidening = params.latitude !== undefined && params.longitude !== undefined && params.radius < RADIUS_MAX
    if (stillWidening) return <LoadingSkeletons />

    return (
      <Box sx={{ mt: fr.spacing("8v"), textAlign: "center" }}>
        {/* Illustration legacy réutilisée (pas d'export Figma pour cet état). */}
        <Image src="/images/dosearch.svg" alt="" aria-hidden="true" width={266} height={190} />
        <Box sx={{ mt: fr.spacing("4v"), fontWeight: 700, color: fr.colors.decisions.text.default.grey.default }}>Aucun résultat trouvé pour votre recherche.</Box>
        <Box sx={{ mt: fr.spacing("2v"), color: fr.colors.decisions.text.mention.grey.default }}>
          Nous vous conseillons de modifier vos critères : mots-clés, zone géographique, engagement handicap, etc.
        </Box>
      </Box>
    )
  }

  return (
    <Box>
      <Box>
        {allHits.map((hit, index) => (
          <SearchHitCard
            key={String(hit._id)}
            hit={hit}
            currentParams={params}
            position={index + 1}
            cardRef={
              hit.url_id
                ? (node) => {
                    if (node) cardRefs.current.set(hit.url_id!, node)
                    else cardRefs.current.delete(hit.url_id!)
                  }
                : undefined
            }
          />
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
