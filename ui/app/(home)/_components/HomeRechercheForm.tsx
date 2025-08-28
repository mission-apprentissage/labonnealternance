"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import { Suspense } from "react"

import { RechercheInputsLayout } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheInputsLayout"
import { RechercheLieuAutocomplete } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheLieuAutocomplete"
import { RechercheMetierAutocomplete } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheMetierAutocomplete"
import { RechercheResultTypeCheckboxFormik } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheResultTypeCheckbox"
import { RechercheSubmitButton } from "@/app/(candidat)/recherche/_components/RechercheInputs/RechercheSubmitButton"
import { useNavigateToRecherchePage } from "@/app/(candidat)/recherche/_hooks/useNavigateToRecherchePage"
import type { WithRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"
import { IRechercheForm, RechercheForm, rechercheFormToRechercheParams } from "@/app/_components/RechercheForm/RechercheForm"
import { RechercheFormTitle } from "@/app/_components/RechercheForm/RechercheFormTitle"

function HomeRechercheFormUI(props: { onSubmit: (values: IRechercheForm) => void }) {
  return (
    <Box
      sx={{
        padding: {
          xs: fr.spacing("2w"),
          md: fr.spacing("4w"),
        },
        backgroundColor: fr.colors.decisions.background.default.grey.default,
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("2w"),
        borderRadius: { xs: 0, lg: fr.spacing("1w") },
        boxShadow: "0px 2px 6px 0px #00001229",
      }}
    >
      <RechercheFormTitle />
      <RechercheForm
        onSubmit={props.onSubmit}
        itemTypeRequired={true}
        rechercheParams={{
          displayEntreprises: true,
          displayFormations: true,
          displayPartenariats: true,
        }}
      >
        <RechercheInputsLayout
          viewTypeCheckboxs={<RechercheResultTypeCheckboxFormik canDisplayCounts={false} />}
          metierInput={<RechercheMetierAutocomplete />}
          lieuInput={<RechercheLieuAutocomplete />}
          submitButton={<RechercheSubmitButton>C’est parti</RechercheSubmitButton>}
        />
      </RechercheForm>
    </Box>
  )
}

function HomeRechercheFormComponent(props: WithRecherchePageParams) {
  const onSubmit = useNavigateToRecherchePage(props.rechercheParams)

  return (
    <HomeRechercheFormUI
      onSubmit={(rechercheForm) => {
        onSubmit(rechercheFormToRechercheParams(rechercheForm))
      }}
    />
  )
}

export function HomeRechercheForm(props: WithRecherchePageParams) {
  return (
    <Suspense fallback={<HomeRechercheFormUI onSubmit={null} />}>
      <HomeRechercheFormComponent rechercheParams={props.rechercheParams} />
    </Suspense>
  )
}
