"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox"
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch"
import { Box } from "@mui/material"
import { ChangeEvent, useCallback } from "react"

import { useCandidatRechercheParams } from "@/app/(candidat)/recherche/_hooks/useCandidatRechercheParams"
import { useRechercheResults } from "@/app/(candidat)/recherche/_hooks/useRechercheResults"
import { useUpdateCandidatSearchParam } from "@/app/(candidat)/recherche/_hooks/useUpdateCandidatSearchParam"

export function CandidatRechercheFilters() {
  const params = useCandidatRechercheParams()
  const result = useRechercheResults(params)
  const updateCandidatSearchParam = useUpdateCandidatSearchParam()

  const { displayEntreprises, displayFormations, displayPartenariats, displayMap } = params

  const onEntrepriseChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      updateCandidatSearchParam({ displayEntreprises: e.target.checked })
    },
    [updateCandidatSearchParam]
  )
  const onFormationsChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      updateCandidatSearchParam({ displayFormations: e.target.checked })
    },
    [updateCandidatSearchParam]
  )
  const onPartenariatsChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      updateCandidatSearchParam({ displayPartenariats: e.target.checked })
    },
    [updateCandidatSearchParam]
  )
  const onDisplayMapChange = useCallback(
    (value: boolean) => {
      updateCandidatSearchParam({ displayMap: value })
    },
    [updateCandidatSearchParam]
  )

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
        options={[
          {
            label: `Entreprises${result.status === "success" && result.jobStatus === "success" ? ` (${result.entrepriseCount})` : ""}`,
            nativeInputProps: {
              checked: displayEntreprises,
              onChange: onEntrepriseChange,
              name: "entreprises",
            },
          },
          {
            label: `Formations${result.status === "success" && result.formationStatus === "success" ? ` (${result.formationsCount})` : ""}`,

            nativeInputProps: {
              checked: displayFormations,
              onChange: onFormationsChange,
              name: "formations",
            },
          },
          {
            label: `Partenariats${result.status === "success" && result.jobStatus === "success" ? ` (${result.partenariatCount})` : ""}`,
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
      <ToggleSwitch showCheckedHint={false} label="Afficher la carte" labelPosition="left" inputTitle="display_map" checked={displayMap} onChange={onDisplayMapChange} />
    </Box>
  )
}
