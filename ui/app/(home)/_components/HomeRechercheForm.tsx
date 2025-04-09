"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import { Suspense } from "react"

import { useNavigateToRecherchePage } from "@/app/(candidat)/recherche/_hooks/useNavigateToRecherchePage"
import type { WithRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"
import { RechercheForm, type RechercheFormProps } from "@/app/_components/RechercheForm/RechercheForm"
import { RechercheFormTitle } from "@/app/_components/RechercheForm/RechercheFormTitle"

function HomeRechercheFormUI(props: Pick<RechercheFormProps, "onSubmit">) {
  return (
    <Box
      sx={{
        padding: fr.spacing("4w"),
        backgroundColor: fr.colors.decisions.background.default.grey.default,
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("2w"),
        borderRadius: { xs: 0, lg: fr.spacing("1w") },
        boxShadow: "0px 2px 6px 0px #00001229",
      }}
    >
      <RechercheFormTitle />
      <RechercheForm type="home" onSubmit={props.onSubmit} />
    </Box>
  )
}

function HomeRechercheFormComponent(props: WithRecherchePageParams) {
  const onSubmit = useNavigateToRecherchePage(props.params)

  return <HomeRechercheFormUI onSubmit={onSubmit} />
}

export function HomeRechercheForm(props: WithRecherchePageParams) {
  return (
    <Suspense fallback={<HomeRechercheFormUI onSubmit={null} />}>
      <HomeRechercheFormComponent params={props.params} />
    </Suspense>
  )
}
