"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"

import { RechercheLieuAutocomplete } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheLieuAutocomplete"
import { RechercheMetierAutocomplete } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheMetierAutocomplete"
import { RechercheNiveauSelectForm } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheNiveauSelect"
import { RechercheRayonSelectFormik } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheRayonSelect"
import { RechercheResultTypeCheckboxForm } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheResultTypeCheckbox"
import { RechercheSubmitButton } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheSubmitButton"
import { useItemCounts } from "@/app/(candidat)/recherche/_hooks/useItemCounts"
import { useNavigateToRecherchePage } from "@/app/(candidat)/recherche/_hooks/useNavigateToRecherchePage"
import { IRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"
import { RechercheForm, rechercheFormToRechercheParams } from "@/app/_components/RechercheForm/RechercheForm"

export function RechercheMobileForm(props: { params: IRecherchePageParams }) {
  const navigateToRecherchePage = useNavigateToRecherchePage(props.params)
  const itemCounts = useItemCounts(props.params)

  return (
    <RechercheForm
      onSubmit={(formValues) => {
        navigateToRecherchePage({ ...rechercheFormToRechercheParams(formValues), displayMobileForm: false })
      }}
      rechercheParams={{
        ...props.params,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          gap: fr.spacing("2w"),
        }}
      >
        {!props.params.viewType && (
          <Box
            sx={{
              "& .fr-fieldset__content": {
                display: "flex",
                flexDirection: "row",
                gap: fr.spacing("1w"),
              },
            }}
          >
            <RechercheResultTypeCheckboxForm counts={itemCounts} />
          </Box>
        )}
        <RechercheMetierAutocomplete />
        <RechercheLieuAutocomplete />
        <RechercheRayonSelectFormik />
        <RechercheNiveauSelectForm />
        <RechercheSubmitButton>C’est parti</RechercheSubmitButton>
      </Box>
    </RechercheForm>
  )
}
