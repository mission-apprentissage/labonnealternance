"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox"
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch"
import { Box } from "@mui/material"
import { useSearchParams } from "next/navigation"
import { ChangeEvent, useCallback, useMemo } from "react"

import { PAGES, parseRecherchePageParams } from "@/utils/routes.utils"

export function CandidatRechercheFilters() {
  const params = useSearchParams()

  const { displayEntreprises, displayFormations, displayPartenariats, displayMap } = useMemo(() => parseRecherchePageParams(params), [params])

  const onEntrepriseChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      window.history.pushState(
        null,
        "",
        PAGES.dynamic
          .recherche({
            ...parseRecherchePageParams(params),
            displayEntreprises: e.target.checked,
          })
          .getPath()
      )
    },
    [params]
  )
  const onFormationsChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      window.history.pushState(
        null,
        "",
        PAGES.dynamic
          .recherche({
            ...parseRecherchePageParams(params),
            displayFormations: e.target.checked,
          })
          .getPath()
      )
    },
    [params]
  )
  const onPartenariatsChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      window.history.pushState(
        null,
        "",
        PAGES.dynamic
          .recherche({
            ...parseRecherchePageParams(params),
            displayPartenariats: e.target.checked,
          })
          .getPath()
      )
    },
    [params]
  )
  const onDisplayMapChange = useCallback(
    (value: boolean) => {
      window.history.pushState(
        null,
        "",
        PAGES.dynamic
          .recherche({
            ...parseRecherchePageParams(params),
            displayMap: value,
          })
          .getPath()
      )
    },
    [params]
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
            label: "Entreprises (XX)",
            nativeInputProps: {
              checked: displayEntreprises,
              onChange: onEntrepriseChange,
              name: "entreprises",
            },
          },
          {
            label: "Formations (XX)",

            nativeInputProps: {
              checked: displayFormations,
              onChange: onFormationsChange,
              name: "formations",
            },
          },
          {
            label: "Partenariats (XX)",
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
