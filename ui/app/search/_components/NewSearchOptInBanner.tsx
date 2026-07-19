"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import { useRouter } from "next/navigation"

import { useNewSearchOptIn } from "../_hooks/useNewSearchOptIn"

/**
 * Encart d'invitation au nouveau moteur (home + page de résultats legacy) : box à fond bleu
 * contrasté, contenu centré. « Tester → » active l'opt-in ; avec `navigateToNewSearch`, il
 * ouvre en plus `/search/split` VIERGE (recherche réinitialisée à chaque bascule).
 */
export function NewSearchOptInBanner({ navigateToNewSearch = false }: { navigateToNewSearch?: boolean }) {
  const router = useRouter()
  const { optIn } = useNewSearchOptIn()

  const handleOptIn = () => {
    optIn()
    if (navigateToNewSearch) router.push("/search/split")
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: fr.spacing("3v"),
        flexWrap: "wrap",
        px: fr.spacing("4v"),
        py: fr.spacing("2v"),
        borderRadius: "4px",
        backgroundColor: fr.colors.decisions.background.contrast.blueFrance.default,
      }}
    >
      <Box component="span" className={fr.cx("fr-icon-search-line")} sx={{ color: fr.colors.decisions.text.actionHigh.blueFrance.default }} aria-hidden="true" />
      <Box component="span" sx={{ fontSize: "0.875rem", color: fr.colors.decisions.text.default.grey.default, textAlign: "center" }}>
        <Box component="strong">Nouvelle recherche !</Box> Un nouveau moteur de recherche est en expérimentation, venez l'essayer par ici
      </Box>
      <Box
        component="button"
        type="button"
        onClick={handleOptIn}
        className={fr.cx("fr-link", "fr-link--sm", "fr-icon-arrow-right-line", "fr-link--icon-right")}
        sx={{ whiteSpace: "nowrap" }}
      >
        Tester
      </Box>
    </Box>
  )
}
