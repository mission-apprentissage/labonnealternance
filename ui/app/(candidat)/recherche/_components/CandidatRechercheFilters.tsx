"use client"
import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox"
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch"
import { Box } from "@mui/material"
import { ChangeEvent, Suspense, useCallback } from "react"

import { candidatRechercheFormModal } from "@/app/(candidat)/recherche/_components/CandidatRechercheForm"
import { useNavigateToRecherchePage } from "@/app/(candidat)/recherche/_hooks/useNavigateToRecherchePage"
import { useRechercheResults } from "@/app/(candidat)/recherche/_hooks/useRechercheResults"
import type { WithRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"

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
  forceOpenModal: boolean
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
  forceOpenModal,
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
        <Box
          sx={{
            mt: fr.spacing("3v"),
            display: {
              xs: "none",
              md: "block",
            },
          }}
        >
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
        gridTemplateColumns: "1fr max-content",
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
      <Box
        sx={{
          display: {
            xs: "none",
            md: "block",
          },
        }}
      >
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
      <Box
        sx={{
          display: {
            xs: "block",
            md: "none",
          },
        }}
      >
        <Button
          iconId="fr-icon-filter-line"
          nativeButtonProps={{
            ...candidatRechercheFormModal.buttonProps,
            "data-fr-opened": candidatRechercheFormModal.buttonProps["data-fr-opened"] || forceOpenModal,
          }}
          priority="secondary"
        >
          Modifier la recherche
        </Button>
      </Box>
    </Box>
  )
}

function CandidatRechercheFiltersComponent(props: WithRecherchePageParams) {
  const result = useRechercheResults(props.params)
  const navigateToRecherchePage = useNavigateToRecherchePage(props.params)

  const { displayEntreprises, displayFormations, displayPartenariats, displayMap } = props.params

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
      displayFilters={props.params.displayFilters}
      onEntrepriseChange={onEntrepriseChange}
      onFormationsChange={onFormationsChange}
      onPartenariatsChange={onPartenariatsChange}
      onDisplayMapChange={onDisplayMapChange}
      forceOpenModal={props.params.romes.length === 0}
    />
  )
}

export function CandidatRechercheFilters(props: WithRecherchePageParams) {
  return (
    <Suspense
      fallback={
        <CandidatRechercheFiltersUI
          entrepriseCount={null}
          formationsCount={null}
          partenariatCount={null}
          displayEntreprises={props.params.displayEntreprises}
          displayFormations={props.params.displayFormations}
          displayPartenariats={props.params.displayPartenariats}
          displayMap={props.params.displayMap}
          displayFilters={props.params.displayFilters}
          onEntrepriseChange={null}
          onFormationsChange={null}
          onPartenariatsChange={null}
          onDisplayMapChange={null}
          forceOpenModal={false}
        />
      }
    >
      <CandidatRechercheFiltersComponent {...props} />
    </Suspense>
  )
}
