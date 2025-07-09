"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import { useCallback } from "react"

import { RechercheNiveauSelect } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheNiveauSelect"
import { RechercheRayonSelect } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheRayonSelect"
import { RechercheToggleMap } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheToggleMap"
import { useNavigateToRecherchePage } from "@/app/(candidat)/recherche/_hooks/useNavigateToRecherchePage"
import type { WithRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"

export function CandidatRechercheFilters(props: WithRecherchePageParams) {
  const rechercheParams = props.params
  const { displayMap, geo, diploma } = rechercheParams
  const { radius } = geo ?? {}

  const navigateToRecherchePage = useNavigateToRecherchePage(rechercheParams)
  const onDisplayMapChange = useCallback(
    (value: boolean) => {
      navigateToRecherchePage({ displayMap: value }, true)
    },
    [navigateToRecherchePage]
  )

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        marginLeft: fr.spacing("10w"),
        paddingRight: fr.spacing("2w"),
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: fr.spacing("3w"),
        }}
      >
        <RechercheRayonSelect value={radius} onChange={(newRadius) => navigateToRecherchePage({ geo: { ...geo, radius: newRadius } })} />
        <RechercheNiveauSelect value={diploma} onChange={(newDiploma) => navigateToRecherchePage({ diploma: newDiploma })} />
      </Box>
      <Box
        sx={{
          alignSelf: "flex-end",
        }}
      >
        <RechercheToggleMap onChange={onDisplayMapChange} checked={displayMap} />
      </Box>
    </Box>
  )
}
