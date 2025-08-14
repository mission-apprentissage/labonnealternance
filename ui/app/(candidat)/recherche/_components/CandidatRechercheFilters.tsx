"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import { useCallback } from "react"

import { RechercheNiveauSelect } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheNiveauSelect"
import { RechercheRayonSelect } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheRayonSelect"
import { RechercheToggleMap } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheToggleMap"
import { useNavigateToRecherchePage } from "@/app/(candidat)/recherche/_hooks/useNavigateToRecherchePage"
import type { IRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"

function CandidatRechercheFiltersRaw({ params: rechercheParams }: { params: IRecherchePageParams }) {
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
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: fr.spacing("3w"),
        }}
      >
        <RechercheRayonSelect
          value={radius}
          onChange={(newRadius) => {
            navigateToRecherchePage({ geo: { ...geo, radius: newRadius } })
          }}
          disabled={!geo}
        />
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

export function CandidatRechercheFilters({ params }: { params: IRecherchePageParams }) {
  const { displayMap } = params
  return (
    <Box
      key="filters"
      sx={{
        display: {
          xs: "none",
          md: "block",
        },
        marginTop: fr.spacing("2w"),
        marginBottom: fr.spacing("4w"),
        paddingLeft: displayMap
          ? {
              md: fr.spacing("1w"),
              lg: fr.spacing("2w"),
            }
          : {
              md: fr.spacing("10w"),
              lg: fr.spacing("14w"),
            },
        paddingRight: {
          md: displayMap ? fr.spacing("1w") : fr.spacing("2w"),
          lg: fr.spacing("2w"),
        },
      }}
    >
      <CandidatRechercheFiltersRaw params={params} />
    </Box>
  )
}
