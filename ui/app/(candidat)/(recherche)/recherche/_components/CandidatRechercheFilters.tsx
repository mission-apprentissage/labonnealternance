"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import { RechercheTypesEmploiSelect } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheInputs/RechercheTypeEmploiSelect"
import { useNavigateToRecherchePage } from "@/app/(candidat)/(recherche)/recherche/_hooks/useNavigateToRecherchePage"
import { useRechercheResults } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import type { IRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { SendPlausibleEvent } from "@/utils/plausible"
import { RechercheElligibleHandicapCheckbox } from "./RechercheInputs/RechercheElligibleHandicapCheckbox"
import { RechercheNiveauSelect } from "./RechercheInputs/RechercheNiveauSelect"
import { RechercheRayonSelect } from "./RechercheInputs/RechercheRayonSelect"

function CandidatRechercheFiltersRaw({ rechercheParams }: { rechercheParams: IRecherchePageParams }) {
  const { diploma, radius, elligibleHandicapFilter, typesEmploi, displayFormations, displayEntreprises } = rechercheParams
  const rechercheResults = useRechercheResults(rechercheParams)

  const navigateToRecherchePage = useNavigateToRecherchePage(rechercheParams)

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
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
        {!(displayFormations && !displayEntreprises) && (
          <RechercheTypesEmploiSelect
            rechercheResults={rechercheResults}
            value={typesEmploi ?? []}
            onChange={(newTypesEmploi) => {
              navigateToRecherchePage({ typesEmploi: newTypesEmploi })
            }}
          />
        )}
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
    </Box>
  )
}

export function CandidatRechercheFilters({ rechercheParams }: { rechercheParams: IRecherchePageParams }) {
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
        paddingLeft: {
          md: fr.spacing("2v"),
          lg: fr.spacing("4v"),
        },
        paddingRight: {
          md: fr.spacing("4v"),
          lg: fr.spacing("4v"),
        },
      }}
    >
      <CandidatRechercheFiltersRaw rechercheParams={rechercheParams} />
    </Box>
  )
}
