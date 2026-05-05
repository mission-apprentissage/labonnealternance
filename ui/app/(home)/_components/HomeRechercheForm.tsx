"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import { Suspense } from "react"
import type { IRechercheForm } from "@/app/_components/RechercheForm/RechercheForm"
import { RechercheForm, rechercheFormToRechercheParams } from "@/app/_components/RechercheForm/RechercheForm"
import { RechercheFormTitle } from "@/app/_components/RechercheForm/RechercheFormTitle"
import { RechercheInputsLayout } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheInputs/RechercheInputsLayout"
import { RechercheLieuAutocomplete } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheInputs/RechercheLieuAutocomplete"
import { RechercheMetierAutocomplete } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheInputs/RechercheMetierAutocomplete"
import { RechercheResultTypeCheckboxFormik } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheInputs/RechercheResultTypeCheckbox"
import { RechercheSubmitButton } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheInputs/RechercheSubmitButton"
import { useNavigateToRecherchePage } from "@/app/(candidat)/(recherche)/recherche/_hooks/useNavigateToRecherchePage"
import type { WithRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { MATOMO_EVENTS, pushMatomoEvent } from "@/utils/matomoUtils"

function HomeRechercheFormUI(props: { onSubmit: (values: IRechercheForm) => void }) {
  return (
    <Box
      sx={{
        padding: {
          xs: fr.spacing("4v"),
          md: fr.spacing("8v"),
        },
        backgroundColor: fr.colors.decisions.background.default.grey.default,
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("4v"),
        borderRadius: { xs: 0, md: fr.spacing("2v") },
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
        pushMatomoEvent({
          event: MATOMO_EVENTS.SEARCH_LAUNCHED,
          search_job_name: rechercheForm.metier?.label || "non_renseigné",
          search_address: rechercheForm.lieu?.label || "non_renseigné",
          search_radius: rechercheForm.radius ? parseInt(rechercheForm.radius, 10) : 30,
          search_diploma: rechercheForm.diploma ?? "indifferent",
          search_origin: "page_accueil",
        })
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
