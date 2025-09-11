"use client"

import Button from "@codegouvfr/react-dsfr/Button"
import { useCallback } from "react"

import { useNavigateToRecherchePage } from "@/app/(candidat)/recherche/_hooks/useNavigateToRecherchePage"
import { IRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"

export function RechercheMobileToggleMapButton({ displayMap, rechercheParams }: { rechercheParams: IRecherchePageParams; displayMap: boolean }) {
  const navigateToRecherchePage = useNavigateToRecherchePage(rechercheParams)
  const onDisplayMapChange = useCallback(
    (value: boolean) => {
      navigateToRecherchePage({ displayMap: value }, true)
    },
    [navigateToRecherchePage]
  )

  return (
    <Button onClick={() => onDisplayMapChange(!displayMap)} iconId={displayMap ? "fr-icon-list-unordered" : "fr-icon-map-pin-2-line"}>
      {displayMap ? "Liste" : "Carte"}
    </Button>
  )
}
