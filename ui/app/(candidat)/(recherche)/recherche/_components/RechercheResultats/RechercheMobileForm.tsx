"use client"

import { RechercheForm, rechercheFormToRechercheParams } from "@/app/_components/RechercheForm/RechercheForm"
import { RechercheElligibleHandicapCheckboxFormik } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheInputs/RechercheElligibleHandicapCheckbox"
import { RechercheInputsLayout } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheInputs/RechercheInputsLayout"
import { RechercheLieuAutocomplete } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheInputs/RechercheLieuAutocomplete"
import { RechercheMetierAutocomplete } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheInputs/RechercheMetierAutocomplete"
import { RechercheNiveauSelectFormik } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheInputs/RechercheNiveauSelect"
import { RechercheRayonSelectFormik } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheInputs/RechercheRayonSelect"
import { RechercheResultTypeCheckboxFormik } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheInputs/RechercheResultTypeCheckbox"
import { RechercheSubmitButton } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheInputs/RechercheSubmitButton"
import { RechercheTypesEmploiSelectFormik } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheInputs/RechercheTypeEmploiSelect"
import { useNavigateToRecherchePage } from "@/app/(candidat)/(recherche)/recherche/_hooks/use-navigate-to-recherche-page"
import { useRechercheResults } from "@/app/(candidat)/(recherche)/recherche/_hooks/use-recherche-results"
import type { IRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { MATOMO_EVENTS, pushMatomoEvent, SEARCH_ENGINES } from "@/utils/matomo-utils"

export function RechercheMobileForm({ rechercheParams }: { rechercheParams: IRecherchePageParams }) {
  const navigateToRecherchePage = useNavigateToRecherchePage(rechercheParams)
  const rechercheResults = useRechercheResults(rechercheParams)

  return (
    <RechercheForm
      onSubmit={(formValues) => {
        pushMatomoEvent({
          event: MATOMO_EVENTS.SEARCH_LAUNCHED,
          search_job_name: formValues.metier?.label || "non_renseigné",
          search_address: formValues.lieu?.label || "non_renseigné",
          search_radius: formValues.radius ? parseInt(formValues.radius, 10) : 30,
          search_diploma: formValues.diploma ?? "indifferent",
          search_origin: "page_resultat",
          search_engine: SEARCH_ENGINES.PRODUCTION,
        })
        navigateToRecherchePage({ ...rechercheFormToRechercheParams(formValues), displayMobileForm: false, scrollToRecruteursLba: false })
      }}
      rechercheParams={rechercheParams}
      itemTypeRequired={true}
    >
      <RechercheInputsLayout
        forceMobileStyle={true}
        viewTypeCheckboxs={!rechercheParams.viewType && <RechercheResultTypeCheckboxFormik forceMobileStyle={true} rechercheResults={rechercheResults} />}
        metierInput={<RechercheMetierAutocomplete />}
        lieuInput={<RechercheLieuAutocomplete />}
        rayonSelect={<RechercheRayonSelectFormik />}
        niveauSelect={<RechercheNiveauSelectFormik />}
        typesOffresEmploiSelect={<RechercheTypesEmploiSelectFormik rechercheResults={rechercheResults} />}
        handicapCheckbox={<RechercheElligibleHandicapCheckboxFormik rechercheParams={rechercheParams} />}
        submitButton={
          <RechercheSubmitButton forceMobileStyle={true} compareAllFields={true}>
            Rechercher
          </RechercheSubmitButton>
        }
      />
    </RechercheForm>
  )
}
