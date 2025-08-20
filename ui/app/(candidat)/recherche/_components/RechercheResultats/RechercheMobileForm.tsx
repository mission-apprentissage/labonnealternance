"use client"

import { RechercheInputsLayout } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheInputsLayout"
import { RechercheLieuAutocomplete } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheLieuAutocomplete"
import { RechercheMetierAutocomplete } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheMetierAutocomplete"
import { RechercheNiveauSelectFormik } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheNiveauSelect"
import { RechercheRayonSelectFormik } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheRayonSelect"
import { RechercheResultTypeCheckboxFormik } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheResultTypeCheckbox"
import { RechercheSubmitButton } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheSubmitButton"
import { useNavigateToRecherchePage } from "@/app/(candidat)/recherche/_hooks/useNavigateToRecherchePage"
import { useRechercheResults } from "@/app/(candidat)/recherche/_hooks/useRechercheResults"
import { IRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"
import { RechercheForm, rechercheFormToRechercheParams } from "@/app/_components/RechercheForm/RechercheForm"

export function RechercheMobileForm({ rechercheParams }: { rechercheParams: IRecherchePageParams }) {
  const navigateToRecherchePage = useNavigateToRecherchePage(rechercheParams)
  const rechercheResults = useRechercheResults(rechercheParams)

  return (
    <RechercheForm
      onSubmit={(formValues) => {
        navigateToRecherchePage({ ...rechercheFormToRechercheParams(formValues), displayMobileForm: false })
      }}
      rechercheParams={{
        ...rechercheParams,
      }}
    >
      <RechercheInputsLayout
        viewTypeCheckboxs={<RechercheResultTypeCheckboxFormik rechercheResults={rechercheResults} />}
        metierInput={<RechercheMetierAutocomplete />}
        lieuInput={<RechercheLieuAutocomplete />}
        rayonSelect={<RechercheRayonSelectFormik />}
        niveauSelect={<RechercheNiveauSelectFormik />}
        submitButton={<RechercheSubmitButton>C’est parti</RechercheSubmitButton>}
      />
    </RechercheForm>
  )
}
