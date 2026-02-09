"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import { useCallback } from "react"

import { RechercheElligibleHandicapCheckbox } from "./RechercheInputs/RechercheElligibleHandicapCheckbox"
import { RechercheNiveauSelect } from "./RechercheInputs/RechercheNiveauSelect"
import { RechercheRayonSelect } from "./RechercheInputs/RechercheRayonSelect"
import { RechercheToggleMap } from "./RechercheInputs/RechercheToggleMap"
import { useNavigateToRecherchePage } from "@/app/(candidat)/(recherche)/recherche/_hooks/useNavigateToRecherchePage"
import type { IRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { SendPlausibleEvent } from "@/utils/plausible"

function CandidatRechercheFiltersRaw({ rechercheParams }: { rechercheParams: IRecherchePageParams }) {
  const { displayMap, diploma, radius, elligibleHandicapFilter } = rechercheParams

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
          display: "block",
          "& > *": {
            display: "inline-block",
            marginRight: fr.spacing("6v"),
            marginBottom: `${fr.spacing("2v")} !important`,
            verticalAlign: "bottom",
            "&:last-child": {
              marginRight: 0,
            },
          },
        }}
      >
        <RechercheRayonSelect
          value={radius}
          onChange={(newRadius) => {
            navigateToRecherchePage({ radius: newRadius })
          }}
        />
        <RechercheNiveauSelect
          value={diploma}
          onChange={(newDiploma) => {
            navigateToRecherchePage({ diploma: newDiploma })
          }}
        />
        <RechercheElligibleHandicapCheckbox
          rechercheParams={rechercheParams}
          value={elligibleHandicapFilter}
          onChange={(newValue) => {
            if (newValue) {
              SendPlausibleEvent("Filtre - Engagé Handicap")
            }
            navigateToRecherchePage({ elligibleHandicapFilter: newValue })
          }}
        />
      </Box>
      <Box
        sx={{
          alignSelf: "flex-end",
          marginBottom: fr.spacing("2v"),
        }}
      >
        <RechercheToggleMap onChange={onDisplayMapChange} checked={displayMap} />
      </Box>
    </Box>
  )
}

export function CandidatRechercheFilters({ rechercheParams }: { rechercheParams: IRecherchePageParams }) {
  const { displayMap } = rechercheParams
  return (
    <Box
      key="filters"
      sx={{
        display: {
          xs: "none",
          lg: "block",
        },
        marginTop: fr.spacing("4v"),
        marginBottom: fr.spacing("8v"),
        paddingLeft: displayMap
          ? {
              md: fr.spacing("2v"),
              lg: fr.spacing("4v"),
            }
          : {
              md: fr.spacing("20v"),
              lg: fr.spacing("28v"),
            },
        paddingRight: {
          md: displayMap ? fr.spacing("2v") : fr.spacing("4v"),
          lg: fr.spacing("4v"),
        },
      }}
    >
      <CandidatRechercheFiltersRaw rechercheParams={rechercheParams} />
    </Box>
  )
}
