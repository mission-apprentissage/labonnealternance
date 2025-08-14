"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import { captureException } from "@sentry/nextjs"
import { useCallback, useEffect } from "react"

import { RechercheLieuAutocomplete } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheLieuAutocomplete"
import { RechercheMetierAutocomplete } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheMetierAutocomplete"
import { RechercheResultTypeCheckbox } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheResultTypeCheckbox"
import { RechercheSubmitButton } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheSubmitButton"
import { useItemCounts } from "@/app/(candidat)/recherche/_hooks/useItemCounts"
import { useNavigateToRecherchePage } from "@/app/(candidat)/recherche/_hooks/useNavigateToRecherchePage"
import type { IRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"
import { IRechercheForm, RechercheForm, rechercheFormToRechercheParams, UserItemTypes } from "@/app/_components/RechercheForm/RechercheForm"
import { apiGet } from "@/utils/api.utils"

export function CandidatRechercheForm(props: { params: IRecherchePageParams }) {
  const { displayEntreprises, displayFormations } = props.params
  const checkedItemTypes: UserItemTypes[] = []
  if (displayEntreprises) {
    checkedItemTypes.push(UserItemTypes.EMPLOI)
  }
  if (displayFormations) {
    checkedItemTypes.push(UserItemTypes.FORMATIONS)
  }

  const navigateToRecherchePage = useNavigateToRecherchePage(props.params)
  const itemCounts = useItemCounts(props.params)

  const onSubmit = useCallback(
    (result: IRechercheForm) => {
      navigateToRecherchePage(rechercheFormToRechercheParams(result))
    },
    [navigateToRecherchePage]
  )

  useEffect(() => {
    const controller = new AbortController()
    if (props.params.geo !== null && props.params.geo.address === null) {
      apiGet("/_private/geo/commune/reverse", { querystring: { latitude: props.params.geo.latitude, longitude: props.params.geo.longitude } }, { signal: controller.signal })
        .then((commune) => {
          if (controller.signal.aborted) {
            return
          }

          navigateToRecherchePage({ geo: { ...props.params.geo, address: commune.nom } }, true)
        })
        .catch((err) => {
          if (controller.signal.aborted) {
            return
          }

          captureException(err)
        })
    }

    return () => {
      controller.abort()
    }
  }, [props.params, navigateToRecherchePage])

  return (
    <RechercheForm onSubmit={onSubmit} rechercheParams={props.params}>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: fr.spacing("2w"),
        }}
      >
        {!props.params.viewType && (
          <Box
            sx={{
              "& .fr-fieldset__content": {
                display: "flex",
                flexDirection: "column",
                gap: fr.spacing("1w"),

                "& .fr-checkbox-group": {
                  marginTop: "-0.75rem",
                  marginBottom: "-0.75rem",
                },
              },
            }}
          >
            <RechercheResultTypeCheckbox
              checked={checkedItemTypes}
              counts={itemCounts}
              onChange={(newValues) =>
                navigateToRecherchePage({
                  displayEntreprises: newValues.includes(UserItemTypes.EMPLOI),
                  displayFormations: newValues.includes(UserItemTypes.FORMATIONS),
                })
              }
            />
          </Box>
        )}
        <Box sx={{ flex: 450 }}>
          <RechercheMetierAutocomplete />
        </Box>
        <Box sx={{ flex: 250 }}>
          <RechercheLieuAutocomplete />
        </Box>
        <RechercheSubmitButton />
      </Box>
    </RechercheForm>
  )
}
