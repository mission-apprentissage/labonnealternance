"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"

import { useNewSearchOptIn } from "../_hooks/useNewSearchOptIn"

/**
 * Lien « Sortir du nouveau moteur de recherche » : désactive l'opt-in (+ télémétrie) puis,
 * depuis la page de résultats, navigue vers le legacy `/recherche` VIERGE (aucune traduction
 * de params). Sur la home (`navigateToLegacy=false`), la désactivation du flag suffit — le
 * formulaire legacy se réaffiche sur place.
 */
export function ExitNewSearchLink({ navigateToLegacy = true }: { navigateToLegacy?: boolean }) {
  const { optOut } = useNewSearchOptIn()
  const className = fr.cx("fr-link", "fr-link--sm", "fr-icon-arrow-go-back-line", "fr-link--icon-left")

  if (!navigateToLegacy) {
    return (
      <Box component="button" type="button" onClick={optOut} className={className} sx={{ whiteSpace: "nowrap" }}>
        Sortir du nouveau moteur de recherche
      </Box>
    )
  }

  return (
    <Box component="a" href="/recherche" onClick={optOut} className={className} sx={{ whiteSpace: "nowrap" }}>
      Sortir du nouveau moteur de recherche
    </Box>
  )
}
