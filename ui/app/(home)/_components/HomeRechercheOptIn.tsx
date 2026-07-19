"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import { useEffect, useState } from "react"

import type { WithRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { SearchHomeForm } from "@/app/search/_components/SearchHomeForm"
import { useNewSearchOptIn } from "@/app/search/_hooks/useNewSearchOptIn"

import { HomeRechercheForm } from "./HomeRechercheForm"

/** Encart d'invitation au nouveau moteur, affiché sous le formulaire legacy de la home. */
function OptInBanner({ onOptIn }: { onOptIn: () => void }) {
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
        onClick={onOptIn}
        className={fr.cx("fr-link", "fr-link--sm", "fr-icon-arrow-right-line", "fr-link--icon-right")}
        sx={{ whiteSpace: "nowrap" }}
      >
        Tester
      </Box>
    </Box>
  )
}

/**
 * Coexistence des deux moteurs sur la home : formulaire legacy + encart « Tester → » par
 * défaut ; une fois l'opt-in activé (flag localStorage), formulaire du nouveau moteur SANS
 * filtres + lien de sortie. Le flag n'est lu qu'après le mount (pattern ClientOnly) : le SSR
 * rend toujours le legacy → pas de mismatch d'hydratation.
 */
export function HomeRechercheOptIn(props: WithRecherchePageParams) {
  const { optedIn, optIn } = useNewSearchOptIn()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (mounted && optedIn) {
    return <SearchHomeForm />
  }

  return <HomeRechercheForm rechercheParams={props.rechercheParams} footer={mounted ? <OptInBanner onOptIn={optIn} /> : undefined} />
}
