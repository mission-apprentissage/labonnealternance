"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import { useCallback } from "react"

import { RechercheElligibleHandicapCheckbox } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheElligibleHandicapCheckbox"
import { RechercheNiveauSelect } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheNiveauSelect"
import { RechercheRayonSelect } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheRayonSelect"
import { RechercheToggleMap } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheToggleMap"
import { useNavigateToRecherchePage } from "@/app/(candidat)/recherche/_hooks/useNavigateToRecherchePage"
import type { IRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"
import { rechercheParamsToRechercheForm } from "@/app/_components/RechercheForm/RechercheForm"
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

  const sendPlausibleEvent = () => {
    const rechercheForm = rechercheParamsToRechercheForm(rechercheParams)
    const { displayedItemTypes } = rechercheForm
    const plausibleLabel = `Recherche - Page de résultats - ${displayedItemTypes.join(" et ")}`
    SendPlausibleEvent(plausibleLabel)
  }

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
          alignItems: "flex-end",
        }}
      >
        <RechercheRayonSelect
          value={radius}
          onChange={(newRadius) => {
            sendPlausibleEvent()
            navigateToRecherchePage({ radius: newRadius })
          }}
        />
        <RechercheNiveauSelect
          value={diploma}
          onChange={(newDiploma) => {
            sendPlausibleEvent()
            navigateToRecherchePage({ diploma: newDiploma })
          }}
        />
        <RechercheElligibleHandicapCheckbox
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
      <CandidatRechercheFiltersRaw rechercheParams={rechercheParams} />
    </Box>
  )
}
