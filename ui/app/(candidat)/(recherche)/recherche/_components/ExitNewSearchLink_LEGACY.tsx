"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import { useRouter } from "next/navigation"

import { useNewSearchOptIn } from "../_hooks/use-new-search-opt-in_LEGACY"

/**
 * Lien « Revenir au moteur de recherche principal » : désactive l'opt-in (+ télémétrie) puis,
 * depuis la page de résultats, navigue vers le legacy `/recherche` VIERGE (aucune traduction
 * de params). Sur la home (`navigateToLegacy=false`), la désactivation du flag suffit — le
 * formulaire legacy se réaffiche sur place.
 */
export function ExitNewSearchLink({ navigateToLegacy = true }: { navigateToLegacy?: boolean }) {
  const router = useRouter()
  const { optOut } = useNewSearchOptIn()
  const className = fr.cx("fr-link", "fr-link--sm", "fr-icon-arrow-go-back-line", "fr-link--icon-left")

  if (!navigateToLegacy) {
    return (
      <Box component="button" type="button" onClick={optOut} className={className} sx={{ whiteSpace: "nowrap" }}>
        Revenir au moteur de recherche principal
      </Box>
    )
  }

  // Navigation SPA (router.push) et non suivi du <a> plein rechargement : new_search_optout
  // est poussé dans le dataLayer au clic, et le déchargement de page gagnait la course contre
  // l'émission du beacon par le container MTM (événement systématiquement perdu). Le href est
  // conservé pour la sémantique lien (survol, molette — auxclick ne passe pas par onClick).
  const handleExit = (event: React.MouseEvent<HTMLAnchorElement>) => {
    optOut()
    // Clic modifié (Cmd/Ctrl/Shift/Alt) : laisser le comportement natif (nouvel onglet /
    // fenêtre) — la page courante reste ouverte, le beacon optout part sans course.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    router.push("/recherche")
  }

  return (
    <Box component="a" href="/recherche" onClick={handleExit} className={className} sx={{ whiteSpace: "nowrap" }}>
      Revenir au moteur de recherche principal
    </Box>
  )
}
