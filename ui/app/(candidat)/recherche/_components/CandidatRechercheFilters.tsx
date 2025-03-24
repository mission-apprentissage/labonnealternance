"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox"
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch"
import { Box } from "@mui/material"
import { ChangeEvent, Suspense, useCallback } from "react"

import { useCandidatRechercheParams } from "@/app/(candidat)/recherche/_hooks/useCandidatRechercheParams"
import { useNavigateToRecherchePage } from "@/app/(candidat)/recherche/_hooks/useNavigateToRecherchePage"
import { useRechercheResults } from "@/app/(candidat)/recherche/_hooks/useRechercheResults"

type CandidatRechercheFiltersUIProps = {
  entrepriseCount: number | null
  displayEntreprises: boolean
  onEntrepriseChange: null | ((e: ChangeEvent<HTMLInputElement>) => void)
  formationsCount: number | null
  displayFormations: boolean
  onFormationsChange: null | ((e: ChangeEvent<HTMLInputElement>) => void)
  partenariatCount: number | null
  displayPartenariats: boolean
  onPartenariatsChange: null | ((e: ChangeEvent<HTMLInputElement>) => void)
  displayMap: boolean
  onDisplayMapChange: null | ((value: boolean) => void)
  displayFilters: boolean
}

function CandidatRechercheFiltersUI({
  entrepriseCount,
  displayEntreprises,
  onEntrepriseChange,
  formationsCount,
  displayFormations,
  onFormationsChange,
  partenariatCount,
  displayPartenariats,
  onPartenariatsChange,
  displayMap,
  onDisplayMapChange,
  displayFilters,
}: CandidatRechercheFiltersUIProps) {
  if (!displayFilters) {
    return (
      <Box
        sx={{
          display: "grid",
          justifyContent: "flex-end",
          gridTemplateColumns: "max-content",
          alignItems: "baseline",
        }}
      >
        <Box sx={{ mt: fr.spacing("3v") }}>
          <ToggleSwitch showCheckedHint={false} label="Afficher la carte" labelPosition="left" inputTitle="display_map" checked={displayMap} onChange={onDisplayMapChange} />
        </Box>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: "grid",
        justifyContent: "space-between",
        gridTemplateColumns: "max-content max-content",
        alignItems: "baseline",
      }}
    >
      <Checkbox
        classes={{
          root: fr.cx("fr-m-0", "fr-p-0"),
          content: fr.cx("fr-m-0", "fr-p-0"),
        }}
        disabled={onEntrepriseChange === null || onFormationsChange === null || onPartenariatsChange === null}
        options={[
          {
            label: `Entreprises${entrepriseCount != null ? ` (${entrepriseCount})` : ""}`,
            nativeInputProps: {
              checked: displayEntreprises,
              onChange: onEntrepriseChange,
              name: "entreprises",
            },
          },
          {
            label: `Formations${formationsCount != null ? ` (${formationsCount})` : ""}`,

            nativeInputProps: {
              checked: displayFormations,
              onChange: onFormationsChange,
              name: "formations",
            },
          },
          {
            label: `Partenariats${partenariatCount != null ? ` (${partenariatCount})` : ""}`,
            nativeInputProps: {
              checked: displayPartenariats,
              onChange: onPartenariatsChange,
              name: "partenariats",
            },
          },
        ]}
        orientation="horizontal"
        small
      />
      <ToggleSwitch
        disabled={onDisplayMapChange === null}
        showCheckedHint={false}
        label="Afficher la carte"
        labelPosition="left"
        inputTitle="display_map"
        checked={displayMap}
        onChange={onDisplayMapChange}
      />
    </Box>
  )
}

function CandidatRechercheFiltersComponent() {
  const params = useCandidatRechercheParams()
  const result = useRechercheResults(params)
  const navigateToRecherchePage = useNavigateToRecherchePage()

  const { displayEntreprises, displayFormations, displayPartenariats, displayMap } = params

  const onEntrepriseChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      navigateToRecherchePage({ displayEntreprises: e.target.checked })
    },
    [navigateToRecherchePage]
  )
  const onFormationsChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      navigateToRecherchePage({ displayFormations: e.target.checked })
    },
    [navigateToRecherchePage]
  )
  const onPartenariatsChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      navigateToRecherchePage({ displayPartenariats: e.target.checked })
    },
    [navigateToRecherchePage]
  )
  const onDisplayMapChange = useCallback(
    (value: boolean) => {
      navigateToRecherchePage({ displayMap: value }, true)
    },
    [navigateToRecherchePage]
  )

  return (
    <CandidatRechercheFiltersUI
      entrepriseCount={result.status === "success" && result.jobStatus === "success" ? result.entrepriseCount : null}
      formationsCount={result.status === "success" && result.formationStatus === "success" ? result.formationsCount : null}
      partenariatCount={result.status === "success" && result.jobStatus === "success" ? result.partenariatCount : null}
      displayEntreprises={displayEntreprises}
      displayFormations={displayFormations}
      displayPartenariats={displayPartenariats}
      displayMap={displayMap}
      displayFilters={params.displayFilters}
      onEntrepriseChange={onEntrepriseChange}
      onFormationsChange={onFormationsChange}
      onPartenariatsChange={onPartenariatsChange}
      onDisplayMapChange={onDisplayMapChange}
    />
  )
}

export function CandidatRechercheFilters() {
  return (
    <Suspense
      fallback={
        <CandidatRechercheFiltersUI
          entrepriseCount={null}
          formationsCount={null}
          partenariatCount={null}
          displayEntreprises
          displayFormations
          displayPartenariats
          displayMap
          displayFilters
          onEntrepriseChange={null}
          onFormationsChange={null}
          onPartenariatsChange={null}
          onDisplayMapChange={null}
        />
      }
    >
      <CandidatRechercheFiltersComponent />
    </Suspense>
  )
}
