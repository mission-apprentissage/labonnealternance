"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import { useIsWidget } from "@/app/(candidat)/(recherche)/RechercheLayoutClient"
import { NewSearchOptInBanner } from "@/app/(candidat)/(recherche)/recherche/_components/NewSearchOptInBanner_LEGACY"

/**
 * Encart d'invitation au nouveau moteur — jamais dans les widgets (iframes partenaires).
 * `embedded` : rendu dans le container du moteur legacy (sous les filtres), sans wrapper de page.
 */
export function RechercheOptInBanner({ embedded = false }: { embedded?: boolean }) {
  const isWidget = useIsWidget()
  if (isWidget) return null

  if (embedded) {
    return (
      <Box sx={{ mt: fr.spacing("4v") }}>
        <NewSearchOptInBanner navigateToNewSearch />
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: "xl", margin: "auto", mt: fr.spacing("4v"), px: fr.spacing("4v") }}>
      <NewSearchOptInBanner navigateToNewSearch />
    </Box>
  )
}
