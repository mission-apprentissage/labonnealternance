import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, CircularProgress, Skeleton } from "@mui/material"
import Image from "next/image"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { isAutoRadiusActive, RADIUS_MAX } from "../_hooks/use-auto-radius"
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
  const [highlightedHitId, setHighlightedHitId] = useState<string | null>(null)

  // `scrollToHitId` repasse par null entre deux fermetures de fiche (nettoyage de l'URL par
  // SearchPageClient) : chaque transition null → valeur arme une demande, même pour la même
  // fiche. Ref plutôt que consommation à la volée : la demande doit survivre au retour à null si
  // la carte n'est pas encore rendue. Pas de booléen « déjà scrollé » : le routeur réutilise le
  // composant au fil des allers-retours liste ↔ fiche, un garde définitif ne marcherait qu'une fois.
  const pendingScrollRef = useRef<string | null>(null)
  const prevScrollToHitIdRef = useRef<string | null | undefined>(null)
  if (scrollToHitId !== prevScrollToHitIdRef.current) {
    prevScrollToHitIdRef.current = scrollToHitId
    if (scrollToHitId) pendingScrollRef.current = scrollToHitId
  }

  // Retour depuis une fiche détail : useLayoutEffect + behavior "instant" pour que la première
  // image peinte soit déjà sur la carte consultée, sans flash du haut de liste. Pas de deps :
  // ré-essayé à chaque rendu jusqu'à ce que la carte existe ; jamais chargée, la demande reste
  // armée sans effet. Le halo est déclenché dans le même commit que le scroll.
  useLayoutEffect(() => {
    const target = pendingScrollRef.current
    if (!target) return
    const card = cardRefs.current.get(target)
    if (!card) return
    pendingScrollRef.current = null
    card.scrollIntoView({ block: "center", behavior: "instant" })
    setHighlightedHitId(target)
  })

  // L'animation (0,5 s) est portée par le CSS de SearchHitCard : ce reset réarme seulement le
  // state pour la consultation suivante. Sous la durée de l'animation, il la couperait net.
  useEffect(() => {
    if (!highlightedHitId) return
    const timer = setTimeout(() => setHighlightedHitId(null), 1000)
    return () => clearTimeout(timer)
  }, [highlightedHitId])

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
    // ne s'affiche qu'une fois tous les paliers épuisés (100 km). Même condition d'activation
    // que le hook (pas d'élargissement en emprise administrative, l'état vide s'affiche direct).
    const stillWidening = isAutoRadiusActive(params) && params.radius < RADIUS_MAX
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
            isHighlighted={Boolean(hit.url_id) && hit.url_id === highlightedHitId}
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
