"use client"

import { captureException } from "@sentry/nextjs"
import { useCallback, useEffect } from "react"

import { RechercheInputsLayout } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheInputs/RechercheInputsLayout"
import { RechercheLieuAutocomplete } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheInputs/RechercheLieuAutocomplete"
import { RechercheMetierAutocomplete } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheInputs/RechercheMetierAutocomplete"
import { RechercheResultTypeCheckbox } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheInputs/RechercheResultTypeCheckbox"
import { RechercheSubmitButton } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheInputs/RechercheSubmitButton"
import { useNavigateToRecherchePage } from "@/app/(candidat)/(recherche)/recherche/_hooks/useNavigateToRecherchePage"
import { useRechercheResults } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import type { IRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { IRechercheForm, RechercheForm, rechercheFormToRechercheParams, UserItemTypes } from "@/app/_components/RechercheForm/RechercheForm"
import { apiGet } from "@/utils/api.utils"

export function CandidatRechercheForm({ rechercheParams }: { rechercheParams: IRecherchePageParams }) {
  const rechercheResults = useRechercheResults(rechercheParams)

  const { displayEntreprises, displayFormations } = rechercheParams
  const checkedItemTypes: UserItemTypes[] = []
  if (displayEntreprises) {
    checkedItemTypes.push(UserItemTypes.EMPLOI)
  }
  if (displayFormations) {
    checkedItemTypes.push(UserItemTypes.FORMATIONS)
  }

  const navigateToRecherchePage = useNavigateToRecherchePage(rechercheParams)

  const onSubmit = useCallback(
    (rechercheForm: IRechercheForm) => {
      navigateToRecherchePage(rechercheFormToRechercheParams(rechercheForm))
    },
    [navigateToRecherchePage]
  )

  useEffect(() => {
    const controller = new AbortController()
    if (rechercheParams.geo !== null && rechercheParams.geo.address === null) {
      apiGet("/_private/geo/commune/reverse", { querystring: { latitude: rechercheParams.geo.latitude, longitude: rechercheParams.geo.longitude } }, { signal: controller.signal })
        .then((commune) => {
          if (controller.signal.aborted) {
            return
          }

          navigateToRecherchePage({ geo: { ...rechercheParams.geo, address: commune.nom } }, true)
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
  }, [rechercheParams, navigateToRecherchePage])

  return (
    <RechercheForm onSubmit={onSubmit} rechercheParams={rechercheParams}>
      <RechercheInputsLayout
        viewTypeCheckboxs={
          <RechercheResultTypeCheckbox
            checked={checkedItemTypes}
            rechercheResults={rechercheResults}
            onChange={(newValues) =>
              navigateToRecherchePage({
                displayEntreprises: newValues.includes(UserItemTypes.EMPLOI),
                displayPartenariats: newValues.includes(UserItemTypes.EMPLOI) && newValues.includes(UserItemTypes.FORMATIONS),
                displayFormations: newValues.includes(UserItemTypes.FORMATIONS),
              })
            }
          />
        }
        metierInput={<RechercheMetierAutocomplete />}
        lieuInput={<RechercheLieuAutocomplete />}
        submitButton={<RechercheSubmitButton />}
      />
    </RechercheForm>
  )
}
